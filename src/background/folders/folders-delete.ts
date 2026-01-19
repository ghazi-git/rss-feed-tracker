import { getNodeTree } from "@/background/folders/folders-options";
import { DeletionError, NotFoundError } from "@/background/utils/errors";
import { updateFeedUnreadCount } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";
import { txDone } from "@/utils/idb-helpers";

export async function deleteFolder(id: number) {
  using conn = await getDBConnection();

  const allNodes = await conn.db.getAll("nodes");
  const folder = allNodes
    .filter((f) => f.type === "folder")
    .find((f) => f.id === id);
  if (!folder) {
    console.error(`folders-delete: failure to get the folder id=${id}`);
    const msg = "Unable to find the folder, it may have been already deleted.";
    throw new NotFoundError(msg);
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
    ["posts", "feedmetadata", "nodes"],
    "readwrite",
  );
  const postStore = tx.objectStore("posts");
  const feedmetadataStore = tx.objectStore("feedmetadata");
  const nodeStore = tx.objectStore("nodes");

  const promises: Promise<void>[] = [];
  for (const feed of feedsToDelete) {
    promises.push(
      postStore.delete(
        IDBKeyRange.bound([feed.id], [feed.id + 1], false, true),
      ),
      feedmetadataStore.delete(feed.id),
      nodeStore.delete(feed.id),
    );
  }
  promises.push(...foldersToDelete.map((f) => nodeStore.delete(f.id)));
  await Promise.all(promises);

  if (folder.unreadCount) {
    await updateFeedUnreadCount(tx, folder.parentId, -folder.unreadCount);
  }

  try {
    await txDone(tx);
  } catch (e) {
    const msg =
      "Unable to delete the folder and its contents, please try again.";
    throw new DeletionError(msg, { cause: e });
  }
}
