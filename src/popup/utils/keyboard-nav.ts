import { TreeNode } from "@/db-setup";
import { FeedPost } from "@/messaging-wrapper";

export function getListItemsFromPosts(posts: FeedPost[]) {
  return posts.map((p) => getListItemFromPost(p));
}

const ID_SEPARATOR = "||";
export function getListItemFromPost(post: FeedPost) {
  return `${post.feedId}${ID_SEPARATOR}${post.guid}`;
}

export function isFocusedPost(
  listItem: string | null,
  feedId: number,
  guid: string,
) {
  if (listItem === null) return false;

  const id = getPostIdFromListItem(listItem);
  return id?.feedId === feedId && id.guid === guid;
}

export function getPostIdFromListItem(listItem: string | null) {
  if (!listItem) return null;

  const idx = listItem.indexOf(ID_SEPARATOR);
  if (idx >= 0) {
    const prefix = listItem.slice(0, idx);
    const suffix = listItem.slice(idx + ID_SEPARATOR.length);
    const feedId = parseInt(prefix);
    if (!isNaN(feedId) && suffix) {
      return { feedId, guid: suffix };
    }
  }
  return null;
}

export function getListItemsFromNodes(nodes: TreeNode[]) {
  return nodes.map((n) => getListItemFromNode(n.id));
}

export function getListItemFromNode(nodeId: number) {
  return `${nodeId}`;
}

export function isFocusedNode(listItem: string | null, nodeId: number) {
  return getNodeIdFromListItem(listItem) === nodeId;
}

export function getNodeIdFromListItem(listItem: string | null) {
  if (!listItem) return null;

  const nodeId = parseInt(listItem);
  return isNaN(nodeId) ? null : nodeId;
}
