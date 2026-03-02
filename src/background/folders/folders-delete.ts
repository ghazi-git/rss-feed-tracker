import { DeletionError, NotFoundError } from "@/background/utils/errors";
import { updateFeedUnreadCount } from "@/background/utils/nodes";
import { getRemoveOperation } from "@/background/utils/search";
import { getDBConnection } from "@/db-setup";
import { txDone } from "@/utils/idb-helpers";
import { getNodeTree } from "@/utils/nodes";

export async function deleteFolder(id: number) {
  using conn = await getDBConnection();

  const allNodes = await conn.db.getAll("nodes");
  const folder = allNodes
    .filter((f) => f.type === "folder")
    .find((f) => f.id === id);
  if (!folder) {
    const msg = "Unable to find the folder, it may have been already deleted.";
    throw new NotFoundError(msg, { cause: `folder not found id=${id}` });
  }
  if (!folder.parentId) {
    throw new DeletionError("You cannot delete the top-level folder.");
  }

  const tree = getNodeTree(folder, allNodes);
  const feedsToDelete = tree
    .map(([node]) => node)
    .filter((n) => n.type === "feed");
  const foldersToDelete = tree
    .map(([node]) => node)
    .filter((n) => n.type === "folder");

  const tx = conn.db.transaction(
    ["posts", "nodes", "searchIndexOperations"],
    "readwrite",
  );
  const postStore = tx.objectStore("posts");
  const nodeStore = tx.objectStore("nodes");
  const opStore = tx.objectStore("searchIndexOperations");

  const postsToDelete: [number, string][] = [];
  const promises: Promise<void>[] = [];
  for (const feed of feedsToDelete) {
    const postsQuery = IDBKeyRange.bound([feed.id], [feed.id + 1], false, true);
    const toDelete = await postStore.getAllKeys(postsQuery);
    postsToDelete.push(...toDelete);

    promises.push(postStore.delete(postsQuery), nodeStore.delete(feed.id));
  }
  promises.push(...foldersToDelete.map((f) => nodeStore.delete(f.id)));
  await Promise.all(promises);

  if (folder.unreadCount) {
    await updateFeedUnreadCount(tx, folder.parentId, -folder.unreadCount);
  }

  postsToDelete.forEach(([feedId, guid]) => {
    const operation = getRemoveOperation(feedId, guid);
    opStore.add(operation);
  });

  try {
    await txDone(tx);
  } catch (e) {
    const msg =
      "Unable to delete the folder and its contents, please try again.";
    throw new DeletionError(msg, { cause: e });
  }
}
