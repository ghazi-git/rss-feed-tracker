import { getNodeTree } from "@/background/folders/folders-options";
import { setUnreadCountOnExtensionBadge } from "@/background/utils/badge-unread-count";
import { getInitialFeedmetadata } from "@/background/utils/feedmetadata";
import {
  ExtensionDB,
  Feed,
  FeedMetadata,
  Folder,
  ReadTX,
  ReadWriteTX,
  TreeNode,
} from "@/db-setup";
import { FeedFormData } from "@/messaging-wrapper";

export async function getHighestSortOrder(
  tx: ReadTX | ReadWriteTX,
  folder: number,
) {
  const nodeStore = tx.objectStore("nodes");
  const index = nodeStore.index("by_parent_id_sort_order");
  const children = await index.getAll({
    query: IDBKeyRange.bound([folder], [folder + 1], false, true),
    count: 1,
    direction: "prev",
  });
  const sortOrder = children[0]?.sortOrder ?? 0;
  return sortOrder + 10_000;
}

export function getNodeMap(nodes: TreeNode[]) {
  return new Map(nodes.map((node) => [node.id, node]));
}

export function getAncestors(nodeId: number, nodeMap: Map<number, TreeNode>) {
  const ancestors: TreeNode[] = [];
  let id: number | null = nodeId;
  while (id) {
    const node = nodeMap.get(id);
    if (!node) break;

    ancestors.push(node);
    id = node.parentId;
  }

  return ancestors;
}

export function getChildFeedIds(folder: Folder, nodes: TreeNode[]) {
  const nodeTree = getNodeTree(folder, nodes);
  const childFeeds = nodeTree.map(([n]) => n).filter((n) => n.type === "feed");
  return new Set(childFeeds.map((f) => f.id));
}

export function getNodeLastRunAt(
  node: TreeNode,
  allNodes: TreeNode[],
  metadata: FeedMetadata[],
  defaultTime: number,
) {
  if (node.type === "feed") {
    const feedMetadata = metadata.find((m) => m.feedId === node.id);
    return feedMetadata?.lastRunAt ?? defaultTime;
  } else {
    // the folder's lastRunAt is the max lastRunAt of feeds inside it
    const childFeedIds = getChildFeedIds(node, allNodes);
    const lastRunAts = metadata
      .filter((m) => childFeedIds.has(m.feedId))
      .map((m) => m.lastRunAt)
      .filter((runAt) => runAt !== null)
      .toSorted();
    return lastRunAts.at(-1) ?? defaultTime;
  }
}

export async function updateFeedUnreadCount(
  tx: ReadWriteTX,
  nodeId: number,
  delta: number,
) {
  const nodeStore = tx.objectStore("nodes");
  const nodes = await nodeStore.getAll();
  const nodeMap = getNodeMap(nodes);
  const ancestors = getAncestors(nodeId, nodeMap);
  const promises = ancestors.map((a) => {
    a.unreadCount = Math.max(a.unreadCount + delta, 0);
    nodeStore.put(a);
  });
  await Promise.all(promises);
  // update the unread count on the extension badge
  const rootFolder = ancestors.find((n) => !n.parentId);
  if (rootFolder) {
    setUnreadCountOnExtensionBadge(rootFolder.unreadCount);
  }
}

export async function createFeed(
  tx: ReadWriteTX,
  data: FeedFormData,
  favicon: string | null,
  createdAt: number,
) {
  const sortOrder = await getHighestSortOrder(tx, data.folder);
  const feed = {
    type: "feed",
    name: data.name,
    parentId: data.folder,
    unreadCount: 0,
    sortOrder,
    createdAt,
    feed: {
      favicon,
      url: data.url,
      updateFrequency: data.frequency,
    },
  } as Feed;
  const nodes = tx.objectStore("nodes");
  const feedId = await nodes.add(feed);

  const metadata = getInitialFeedmetadata(feedId);
  const feedmatadata = tx.objectStore("feedmetadata");
  await feedmatadata.add(metadata);

  return { ...feed, id: feedId } as Feed;
}

export async function saveFolder(
  tx: ReadWriteTX,
  name: string,
  parentId: number,
) {
  const sortOrder = await getHighestSortOrder(tx, parentId);
  const folder = {
    type: "folder",
    name,
    parentId,
    sortOrder,
    createdAt: Date.now(),
    unreadCount: 0,
    feed: null,
  } as Folder;

  const nodeStore = tx.objectStore("nodes");
  const folderId = await nodeStore.add(folder);

  return { ...folder, id: folderId } as Folder;
}

export async function createRootFolder(db: ExtensionDB): Promise<Folder> {
  const root = getRootFolderData();
  const folderId = await db.add("nodes", root);
  return { ...root, id: folderId };
}

function getRootFolderData() {
  // type casting because idb does not handle the case where the id is set
  // by indexeddb https://github.com/jakearchibald/idb/issues/150
  return {
    type: "folder",
    name: "My Feeds",
    parentId: null,
    createdAt: Date.now(),
    unreadCount: 0,
    sortOrder: 10_000,
    feed: null,
  } as Folder;
}
