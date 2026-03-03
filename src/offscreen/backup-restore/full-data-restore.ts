import { strFromU8, unzipSync } from "fflate";
import * as v from "valibot";

import { DB_NAME, ExtensionDB, getDBConnection } from "@/db-setup";
import { PreferencesData } from "@/messaging-wrapper";
import {
  BackupManifestSchema,
  NodeBackup,
  NodeBackupSchema,
  PostBackup,
  PostBackupSchema,
} from "@/offscreen/backup-restore/types";
import { RestoreError } from "@/offscreen/errors";
import { getChunks } from "@/utils/chunks";
import { txDone } from "@/utils/idb-helpers";
import { getLogger, Logger } from "@/utils/logging";
import { FEED_POLLING_LOCK } from "@/utils/settings";

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
  const nodes = validateNodesFile(nodesContent);

  logger.debug("acquiring lock....");
  try {
    await navigator.locks.request(
      FEED_POLLING_LOCK,
      { signal: AbortSignal.timeout(2000) },
      async () => {
        logger.debug("clearing existing data...");
        // deleting the DB is way faster than clearing the stores one by one.
        await deleteDB();
        // Now we can start the restore since we did find nodes to import in the backup
        // Opening the db will create it again
        using conn = await getDBConnection();
        const db = conn.db;

        logger.debug(`inserting nodes...`, { count: nodes.length });
        await insertNodes(db, nodes);

        // best-effort restore: restore posts that correspond to the nodes already
        // inserted and skip invalid posts or files with bad data.
        const files = manifest.backupFiles.posts;
        const nodeIds = new Set(nodes.map((n) => n.id));
        await insertPostsFromFiles(db, zipFile, files, nodeIds, logger);
      },
    );
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      logger.debug("aborted (cannot acquire a lock)");
      throw new RestoreError(
        "The feeds are being updated in the background, please try again once that is done.",
        { cause: e },
      );
    } else {
      throw e;
    }
  }

  const res = performance.measure("restore_duration", "restore_start");
  logger.debug("done", { restoreDuration: `${res.duration.toFixed(1)} ms` });

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

function validateNodesFile(contents: string): NodeBackup[] {
  // validate that the contents is an array
  const errorMsg =
    "The backup file is corrupt. The feeds and folders data is invalid.";
  let parsedNodes: unknown;
  try {
    parsedNodes = JSON.parse(contents);
  } catch (e) {
    throw new RestoreError(errorMsg, { cause: e });
  }
  if (!Array.isArray(parsedNodes)) throw new RestoreError(errorMsg);

  const nodes: NodeBackup[] = [];
  parsedNodes.forEach((node) => {
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
  return getTreeElements(rootFolder, nodes);
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

async function insertPostsFromFiles(
  db: ExtensionDB,
  zipFile: Uint8Array<ArrayBuffer>,
  postFilenames: string[],
  nodeIds: Set<number>,
  logger: Logger,
) {
  for (const filename of postFilenames) {
    const postLogger = logger.child({ filename });
    try {
      postLogger.debug("extracting posts file...");
      const fileContents = extractFile(zipFile, filename);
      postLogger.debug("validating posts file...");
      const posts = getValidPosts(fileContents);
      const nodePosts = posts.filter((p) => nodeIds.has(p.feedId));
      if (nodePosts.length) {
        postLogger.debug(`inserting posts...`, { count: nodePosts.length });
        await insertPosts(db, nodePosts);
      }
    } catch (e) {
      postLogger.error("failure", e);
    }
  }
}

async function deleteDB() {
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
    };
  });
}

async function insertNodes(db: ExtensionDB, nodes: NodeBackup[]) {
  const tx = db.transaction(["nodes"], "readwrite");
  const nodeStore = tx.objectStore("nodes");

  const nodePromises = nodes.map((node) => nodeStore.put(node));
  await Promise.all(nodePromises);

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
