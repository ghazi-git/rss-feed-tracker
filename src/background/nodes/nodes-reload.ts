import { NotFoundError } from "@/background/utils/errors";
import { loadFeeds, savePosts } from "@/background/utils/feed-polling";
import { fetchAndParseFeed } from "@/background/utils/feeds-fetch-from-source";
import { ExtensionDB, Feed, Folder, getDBConnection } from "@/db-setup";
import { NodeReloadResponse } from "@/messaging-wrapper";
import { txDone } from "@/utils/idb-helpers";
import { getLogger } from "@/utils/logging";
import { getNodeTree } from "@/utils/nodes";

export async function reloadNode(id: number): Promise<NodeReloadResponse> {
  using conn = await getDBConnection();

  const node = await conn.db.get("nodes", id);
  if (!node) {
    const msg = "Unable to find the feed/folder, it may have been deleted.";
    throw new NotFoundError(msg);
  }

  const newPostsCount =
    node.type === "feed"
      ? await reloadFeed(conn.db, node)
      : await reloadFolder(conn.db, node);

  const updatedNode = await conn.db.get("nodes", id);
  if (!updatedNode) throw new Error("Node not found after feeds reload");

  return {
    newPostsCount,
    unreadCount: updatedNode.unreadCount,
    // set to now since we just reloaded the node
    markAsReadUntil: Date.now(),
  };
}

async function reloadFeed(db: ExtensionDB, node: Feed) {
  const logger = getLogger({
    action: "reload-feed",
    scheduledAt: new Date(),
    feedId: node.id,
  });
  const parsedFeed = await fetchAndParseFeed(node.feed.url, logger);

  const tx = db.transaction(
    ["posts", "nodes", "searchIndexOperations"],
    "readwrite",
  );
  const insertedPosts = await savePosts(
    tx,
    node,
    parsedFeed.posts,
    Date.now(),
    logger,
  );
  await txDone(tx);

  return insertedPosts;
}

async function reloadFolder(db: ExtensionDB, node: Folder) {
  const nodes = await db.getAll("nodes");
  const nodeTree = getNodeTree(node, nodes);
  const childFeeds = nodeTree.map(([n]) => n).filter((n) => n.type === "feed");
  const logger = getLogger({
    action: "reload-folder",
    scheduledAt: new Date(),
    folderId: node.id,
  });
  return await loadFeeds(db, childFeeds, logger);
}
