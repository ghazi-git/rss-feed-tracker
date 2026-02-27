import { parseOpml } from "feedsmith";
import type { Opml } from "feedsmith/types";

import { NotFoundError, OPMLParseError } from "@/background/utils/errors";
import { savePosts } from "@/background/utils/feed-polling";
import { saveFailureMetadata } from "@/background/utils/feedmetadata";
import { fetchAndParseFeed } from "@/background/utils/feeds-fetch-from-source";
import { createFeed, saveFolder } from "@/background/utils/nodes";
import { Feed, getDBConnection, ReadWriteTX } from "@/db-setup";
import { getChunks } from "@/utils/chunks";
import { loadPreferences } from "@/utils/extension-storage";
import { getObject, saveObject, txDone } from "@/utils/idb-helpers";
import { getLogger } from "@/utils/logging";

export async function importOPML(fileContent: string, folder: number) {
  const opml = parseOPML(fileContent);
  if (!opml.body?.outlines?.length) {
    throw new OPMLParseError("The file does not contain any feeds.");
  }

  const outlines = getOutlineTree(opml.body.outlines as Opml.Outline<string>[]);
  if (!outlines.length) {
    throw new OPMLParseError("The file does not contain any feeds.");
  }

  const preferences = await loadPreferences();
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes", "feedmetadata"], "readwrite");
  const parentFolder = await getObject(tx, "nodes", folder);
  if (!parentFolder || parentFolder.type !== "folder") {
    throw new NotFoundError(
      "Unable to find the selected folder, it may have been deleted.",
    );
  }

  const frequency = preferences.defaultFeedUpdateFrequency;
  const feeds = await createNodes(tx, outlines, folder, frequency);
  await txDone(tx);

  // don't keep the user waiting for the posts of all feeds to load (load them
  // in the background). If the service worker is killed by chrome for any
  // reason, then the feeds not fetched will be picked up in the next alarm
  // tick (in a minute)
  loadPosts(feeds);
}

function parseOPML(fileContent: string) {
  try {
    return parseOpml(fileContent);
  } catch (e) {
    throw new OPMLParseError(
      "Unable to parse the feeds. The selected file doesn't seem to be a valid OPML file.",
      { cause: e },
    );
  }
}

function getOutlineTree(outlines: Opml.Outline<string>[]) {
  const outlineTree: OutlineElement[] = [];
  for (const outline of outlines) {
    if (outline.xmlUrl) {
      outlineTree.push({
        type: "feed",
        name: outline.text,
        url: outline.xmlUrl,
      });
    } else if (
      !outline.isComment &&
      !outline.isBreakpoint &&
      outline.outlines?.length
    ) {
      const children = getOutlineTree(outline.outlines);
      if (children.length) {
        outlineTree.push({ type: "folder", name: outline.text, children });
      }
    }
  }

  return outlineTree;
}

async function createNodes(
  tx: ReadWriteTX,
  outlines: OutlineElement[],
  parentId: number,
  frequency: number | null,
) {
  const createdAt = Date.now();
  const feeds: Feed[] = [];
  for (const outline of outlines) {
    if (outline.type === "folder") {
      const folder = await saveFolder(tx, outline.name, parentId);
      const children = outline.children;
      const childFeeds = await createNodes(tx, children, folder.id, frequency);
      feeds.push(...childFeeds);
    } else {
      const data = { ...outline, folder: parentId, frequency };
      const feed = await createFeed(tx, data, null, createdAt);
      feeds.push(feed);
    }
  }
  return feeds;
}

async function loadPosts(feeds: Feed[]) {
  using conn = await getDBConnection();
  const scheduledAt = new Date().toUTCString();
  // load feeds in parallel
  const chunks = getChunks(feeds, 5);
  for (const chunk of chunks) {
    const promises = chunk.map((node) => {
      const logger = getLogger(
        { action: "opml-import", scheduledAt, feedId: node.id },
        true,
      );

      return fetchAndParseFeed(node.feed.url, logger)
        .then(async (parsedFeed) => {
          const tx = conn.db.transaction(
            ["posts", "feedmetadata", "nodes", "searchIndexOperations"],
            "readwrite",
          );
          if (parsedFeed.favicon) {
            // set the favicon here since it wasn't set when first creating
            // the nodes extracted from the OPML
            node.feed.favicon = parsedFeed.favicon;
            await saveObject(tx, "nodes", node);
          }
          const posts = parsedFeed.posts;
          const now = Date.now();
          await savePosts(tx, node, posts, now, logger);
          await txDone(tx);
        })
        .catch(async (e) => {
          logger.error("failure", e);
          await saveFailureMetadata(conn.db, node);
        });
    });
    await Promise.all(promises);
  }
}

interface FeedOutline {
  type: "feed";
  name: string;
  url: string;
}
interface FolderOutline {
  type: "folder";
  name: string;
  children: OutlineElement[];
}
export type OutlineElement = FolderOutline | FeedOutline;
