import { strFromU8, unzipSync } from "fflate";
import * as v from "valibot";

import { getChunks } from "@/background/utils/chunks";
import { DB_NAME, ExtensionDB, getDBConnection } from "@/db-setup";
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
import { getLogger, glogger } from "@/utils/logging";
import { retry } from "@/utils/retry-on-error";

export async function restoreExtension(
  fileURL: string,
): Promise<PreferencesData> {
  const logger = getLogger({ action: "restore-extension" });
  logger.debug("start");
  performance.mark("restore_start");

  logger.debug("loading zip backup into memory...");
  const zipFile = await getZipFile(fileURL);
  URL.revokeObjectURL(fileURL);

  logger.debug("validating backup before restore...");
  const manifestContents = extractFile(zipFile, "manifest.json");
  const manifest = validateManifest(manifestContents);
  const nodesFilename = manifest.backupFiles.feeds_folders;
  const nodesContent = extractFile(zipFile, nodesFilename);
  const { nodes, feedmetadata } = validateNodesFile(nodesContent);

  logger.debug("clearing existing data...");
  // deleting the DB is way faster than clearing the stores one by one.
  await deleteDB();
  // Now we can start the restore since we did find nodes to import in the backup
  // Opening the db will create it again
  using conn = await getDBConnection();
  // prevent the background fetch from inserting data while the restore is in progress
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  await using _ = await getLock(conn.db);

  logger.debug(`inserting nodes...`, { count: nodes.length });
  await insertNodes(conn.db, nodes, feedmetadata);

  // best-effort restore: restore posts that correspond to the nodes already
  // inserted and skip invalid posts or files with bad data.
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const filename of manifest.backupFiles.posts) {
    const postLogger = logger.child({ filename });
    try {
      postLogger.debug("extracting posts file...");
      const fileContents = extractFile(zipFile, filename);
      postLogger.debug("validating posts file...");
      const posts = getValidPosts(fileContents);
      const nodePosts = posts.filter((p) => nodeIds.has(p.feedId));
      if (nodePosts.length) {
        postLogger.debug(`inserting posts...`, { count: nodePosts.length });
        await insertPosts(conn.db, nodePosts);
      }
    } catch (e) {
      postLogger.error("failure", e);
    }
  }

  const res = performance.measure("restore_duration", "restore_start");
  logger.debug("done", { restoreDuration: `${res.duration.toFixed(1)} ms` });

  return manifest.preferences;
}

async function getLock(db: ExtensionDB) {
  const action = "restore-extension";
  glogger.debug("acquiring lock....", { action });
  const lockId = "feed-polling";
  try {
    return await retry(() => acquireLock(db, lockId));
  } catch {
    // lock in use
    const expired = await hasLockExpired(db, lockId);
    if (expired) {
      glogger.debug("force-releasing expired lock ...", { action });
      await releaseLock(db, lockId);
    }
    glogger.debug("aborted (cannot acquire a lock)", { action });
    throw new RestoreError(
      "The feeds are being updated in the background, please try again once that is done.",
    );
  }
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

async function deleteDB() {
  // get a lock to avoid background feed fetching from inserting data while
  // we're deleting the DB here
  const conn = await getDBConnection();
  await getLock(conn.db);
  conn.db.close();

  return await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = async () => {
      reject(
        new RestoreError(
          "Unable to clear DB data before restoring the backup. Please try again.",
          { cause: request.error },
        ),
      );
      // we also need to remove the lock
      using conn = await getDBConnection();
      await releaseLock(conn.db, "feed-polling");
    };
  });
}

async function insertNodes(
  db: ExtensionDB,
  nodes: NodeBackup[],
  metadata: FeedMetadataBackup[],
) {
  const metadataMap = new Map(metadata.map((m) => [m.feedId, m]));
  const metadataToInsert = nodes
    .filter((n) => n.type === "feed")
    .map((feed) => {
      return (
        metadataMap.get(feed.id) ?? {
          feedId: feed.id,
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

function getValidPosts(contents: string): PostBackup[] {
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
  const chunks = getChunks(posts, 2000);
  for (const chunk of chunks) {
    await insertPostsChunk(db, chunk);
  }
}

async function insertPostsChunk(db: ExtensionDB, posts: PostBackup[]) {
  const tx = db.transaction(["posts"], "readwrite");
  const store = tx.objectStore("posts");
  const promises = posts.map((p) => store.put(p));
  await Promise.all([...promises, txDone(tx)]);
}
