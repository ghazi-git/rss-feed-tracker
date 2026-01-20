import { strFromU8, unzipSync } from "fflate";
import * as v from "valibot";

import { retry } from "@/background/utils/retry-on-error";
import { ExtensionDB, getDBConnection } from "@/db-setup";
import { PreferencesData } from "@/messaging-wrapper";
import {
  BackupManifestSchema,
  FeedMetadataBackup,
  FeedMetadataBackupSchema,
  NodeBackup,
  NodeBackupSchema,
  NodesBackupFileSchema,
  PostBackup,
  PostBackupSchema,
} from "@/offscreen/backup-restore/types";
import { RestoreError } from "@/offscreen/errors";
import { txDone } from "@/utils/idb-helpers";
import { acquireLock, hasLockExpired, releaseLock } from "@/utils/locks";
import { glogger } from "@/utils/logging";

export async function restoreExtension(
  fileURL: string,
): Promise<PreferencesData> {
  using conn = await getDBConnection();
  // prevent the background fetch from attempting to insert data while
  // the restore is in progress
  const lockId = "feed-polling";
  const getLock = async () => acquireLock(conn.db, lockId);
  await using disposer = new AsyncDisposableStack();
  try {
    disposer.use(await retry(getLock));
  } catch {
    // lock in use
    const expired = await hasLockExpired(conn.db, lockId);
    if (expired) {
      await releaseLock(conn.db, lockId);
    }
    throw new RestoreError(
      "The feeds are being updated in the background, please try again once that is done.",
    );
  }

  const zipFile = await getZipFile(fileURL);
  URL.revokeObjectURL(fileURL);

  const manifestContents = extractFile(zipFile, "manifest.json");
  const manifest = validateManifest(manifestContents);
  const nodesContent = extractFile(zipFile, manifest.backupFiles.feeds_folders);
  const { nodes, feedmetadata } = validateNodesFile(nodesContent);

  // now we can start the restore since we did find nodes to import in the backup
  await clearDB(conn.db);
  await insertNodes(conn.db, nodes, feedmetadata);

  // best-effort restore: restore posts that correspond to the nodes already
  // inserted and skip invalid posts or files with bad data.
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const filename of manifest.backupFiles.posts) {
    try {
      const fileContents = extractFile(zipFile, filename);
      const posts = getPosts(fileContents);
      const nodePosts = posts.filter((p) => nodeIds.has(p.feedId));
      if (nodePosts.length) {
        await insertPosts(conn.db, nodePosts);
      }
    } catch (e) {
      glogger.error(`Failed to process file=${filename}`, e);
    }
  }

  return manifest.preferences;
}

async function getZipFile(url: string) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(
        `File inaccessible status=${resp.status} statusText=${resp.statusText}`,
      );
    }

    return new Uint8Array(await resp.arrayBuffer());
  } catch (e) {
    throw new RestoreError("Unable to load the file.", { cause: e });
  }
}

function extractFile(zipFile: Uint8Array, filename: string) {
  const decompressed = unzipSync(zipFile, {
    filter(file) {
      return file.name === filename;
    },
  });

  if (!decompressed[filename]) {
    throw new RestoreError(
      `The '${filename}' file was not found in the backup`,
    );
  }
  return strFromU8(decompressed[filename]);
}

function validateManifest(contents: string) {
  try {
    return v.parse(BackupManifestSchema, JSON.parse(contents));
  } catch (e) {
    const msg =
      e instanceof v.ValiError
        ? `The backup file is corrupt. The data in manifest.json is invalid (${e.message}).`
        : "The backup file is corrupt. The data format in manifest.json is invalid.";
    throw new RestoreError(msg, { cause: e });
  }
}

function validateNodesFile(contents: string): {
  nodes: NodeBackup[];
  feedmetadata: FeedMetadataBackup[];
} {
  // validate that there are 2 keys nodes and feedmetadata and that each
  // contains a list of objects. Then, we will collect valid objects (invalid
  // ones will be ignored) and check that we have a valid root node
  type Obj = Record<string, unknown>;
  let fileData: { nodes: Obj[]; feedmetadata: Obj[] };
  try {
    fileData = v.parse(NodesBackupFileSchema, JSON.parse(contents));
  } catch (e) {
    const msg =
      e instanceof v.ValiError
        ? `The backup file is corrupt. The feeds and folders data is invalid (${e.message}).`
        : "The backup file is corrupt. The feeds and folders data is invalid.";
    throw new RestoreError(msg, { cause: e });
  }

  const nodes: NodeBackup[] = [];
  fileData.nodes.forEach((node) => {
    const res = v.safeParse(NodeBackupSchema, node);
    if (res.success) {
      nodes.push(res.output);
    }
  });
  const rootFolder = nodes.find((n) => !n.parentId);
  if (!rootFolder || rootFolder.type !== "folder") {
    throw new RestoreError(
      "The backup file is corrupt. The root folder was not found.",
    );
  }

  // now we will keep nodes based on that root folder
  const validNodes = getTreeElements(rootFolder, nodes);
  const metadata: FeedMetadataBackup[] = [];
  fileData.feedmetadata.forEach((m) => {
    const res = v.safeParse(FeedMetadataBackupSchema, m);
    if (res.success) {
      metadata.push(res.output);
    }
  });

  return { nodes: validNodes, feedmetadata: metadata };
}

type TreeElement = { id: number; parentId: number | null };
function getTreeElements<T extends TreeElement>(rootNode: T, nodes: T[]) {
  const result: T[] = [];
  const queue: T[] = [rootNode];

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    const children = nodes.filter((n) => n.parentId === node.id);
    queue.push(...children);
  }
  return result;
}

async function clearDB(db: ExtensionDB) {
  await Promise.all([
    db.clear("nodes"),
    db.clear("feedmetadata"),
    db.clear("posts"),
  ]);
}

async function insertNodes(
  db: ExtensionDB,
  nodes: NodeBackup[],
  metadata: FeedMetadataBackup[],
) {
  const metadataMap = new Map(metadata.map((m) => [m.feedId, m]));
  const metadataToInsert = nodes.map((node) => {
    return (
      metadataMap.get(node.id) ?? {
        feedId: node.id,
        nextRunAt: null,
        lastRunAt: null,
        lastRunResult: null,
        lastRunNotes: null,
        lastSuccessfulRunAt: null,
        lastUpdatedAt: null,
      }
    );
  });

  const tx = db.transaction(["nodes", "feedmetadata"], "readwrite");
  const nodeStore = tx.objectStore("nodes");
  const metadataStore = tx.objectStore("feedmetadata");

  const nodePromises = nodes.map((node) => nodeStore.put(node));
  const metadataPromises = metadataToInsert.map((m) => metadataStore.put(m));
  await Promise.all([...nodePromises, ...metadataPromises]);

  await txDone(tx);
}

function getPosts(contents: string): PostBackup[] {
  const posts = JSON.parse(contents);
  if (Array.isArray(posts)) {
    const validPosts: PostBackup[] = [];
    posts.forEach((post) => {
      const res = v.safeParse(PostBackupSchema, post);
      if (res.success) {
        validPosts.push(res.output);
      }
    });
    return validPosts;
  }
  return [];
}

async function insertPosts(db: ExtensionDB, posts: PostBackup[]) {
  const tx = db.transaction(["posts"], "readwrite");
  const store = tx.objectStore("posts");
  const promises = posts.map((p) => store.put(p));
  await Promise.all([...promises, txDone(tx)]);
}
