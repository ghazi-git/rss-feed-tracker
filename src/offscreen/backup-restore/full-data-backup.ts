import { AsyncZipDeflate, strToU8, Zip } from "fflate";

import { ExtensionDB, getDBConnection } from "@/db-setup";
import { PreferencesData } from "@/messaging-wrapper";
import {
  BackupManifestV1,
  JSONFilename,
  NodesBackupFile,
  PostsBackupFile,
} from "@/offscreen/backup-restore/types";
import { BackupError } from "@/offscreen/errors";
import { triggerFileDownload } from "@/offscreen/utils";
import { getAll } from "@/utils/idb-helpers";
import { FEED_POLLING_LOCK } from "@/utils/settings";

import pkg from "../../../package.json";

export async function backupExtension(params: PreferencesData) {
  // acquire a lock to avoid data "inconsistency" due to receiving posts while
  // doing the backup (for example, a feed lastRunAt that is not in line with
  // the latest post fetchedAt)
  try {
    await navigator.locks.request(
      FEED_POLLING_LOCK,
      { signal: AbortSignal.timeout(2000) },
      async () => {
        using conn = await getDBConnection();
        await generateBackup(conn.db, params);
      },
    );
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      throw new BackupError(
        "The feeds are being updated in the background, please try again in few moments.",
        { cause: e },
      );
    } else {
      throw e;
    }
  }
}

async function generateBackup(db: ExtensionDB, preferences: PreferencesData) {
  const chunks: Uint8Array<ArrayBufferLike>[] = [];

  return new Promise<void>(async (resolve, reject) => {
    const zip = new Zip((err, chunk, final) => {
      if (err) {
        reject(err);
        return;
      }

      chunks.push(chunk);
      if (final) {
        const filename = `rss_feed_tracker_backup_${new Date().toISOString()}.zip`;
        // @ts-expect-error the zip is created properly despite the type
        // warning about chunks
        const blob = new Blob(chunks, { type: "application/zip" });
        triggerFileDownload(filename, blob);
        resolve();
      }
    });

    addBackupFiles(db, zip, preferences)
      .then(() => zip.end())
      .catch((e) => reject(e));
  });
}

async function addBackupFiles(
  db: ExtensionDB,
  zipFile: Zip,
  preferences: PreferencesData,
) {
  // first the folders and feeds file
  const nodesFilename: JSONFilename = "nodes.json";
  const nodesFileData = await getNodesData(db);
  addFileToZIP(zipFile, nodesFilename, nodesFileData);

  // then the posts files with each containing 20K posts
  let cursor: { feedId: number; guid: string } | null = null;
  const postsFilenames: JSONFilename[] = [];
  const chunkSize = 20_000;
  let chunkNumber = 0;
  while (true) {
    const posts = await getPostsData(db, chunkSize, cursor);
    if (posts.length === 0) break;

    const filename: JSONFilename = `posts_${String(chunkNumber).padStart(4, "0")}.json`;
    postsFilenames.push(filename);
    addFileToZIP(zipFile, filename, posts);
    if (posts.length >= chunkSize) {
      cursor = posts[posts.length - 1];
      chunkNumber++;
    } else {
      break;
    }
  }

  // last, create the backup manifest
  const manifestData = await getManifestData(
    preferences,
    nodesFilename,
    postsFilenames,
  );
  addFileToZIP(zipFile, "manifest.json", manifestData);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addFileToZIP(zipFile: Zip, filename: JSONFilename, jsonData: any) {
  const file = new AsyncZipDeflate(filename);
  zipFile.add(file);
  file.push(strToU8(JSON.stringify(jsonData, null, 2)), true);
}

async function getNodesData(db: ExtensionDB): Promise<NodesBackupFile> {
  const tx = db.transaction(["nodes", "feedmetadata"]);
  const nodes = await getAll(tx, "nodes");
  if (!nodes.length) {
    throw new BackupError("There are no feeds or folders to back up.");
  }

  const metadata = await getAll(tx, "feedmetadata");
  return { nodes, feedmetadata: metadata };
}

async function getPostsData(
  db: ExtensionDB,
  chunkSize: number,
  cursor: { feedId: number; guid: string } | null,
): Promise<PostsBackupFile> {
  const query = cursor
    ? IDBKeyRange.lowerBound([cursor.feedId, cursor.guid], true)
    : undefined;

  return await db.getAll("posts", { query, count: chunkSize });
}

async function getManifestData(
  preferences: PreferencesData,
  nodesFilename: JSONFilename,
  postsFilename: JSONFilename[],
): Promise<BackupManifestV1> {
  return {
    backupVersion: 1,
    extensionName: pkg.name,
    extensionVersion: pkg.version,
    createdAt: new Date().toISOString(),
    preferences,
    backupFiles: { feeds_folders: nodesFilename, posts: postsFilename },
  };
}
