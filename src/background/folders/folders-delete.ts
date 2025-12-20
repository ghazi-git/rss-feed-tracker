import { unwrap } from "idb";

import { getDBConnection } from "@/background/db-setup";
import { getNodeTree } from "@/background/folders/folders-options";
import { DeletionError, NotFoundError } from "@/background/utils/errors";
import { txDone } from "@/background/utils/idb-helpers";

export async function deleteFolder(id: number) {
  using conn = await getDBConnection();

  const allNodes = await conn.db.getAll("nodes");
  const folder = allNodes
    .filter((f) => f.type === "folder")
    .find((f) => f.id === id);
  if (!folder) {
    console.error(`folders-delete: failure to get the folder id=${id}`);
    const msg = "Unable to find the folder, it may have been deleted.";
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

  const tx = unwrap(
    conn.db.transaction(["posts", "feedmetadata", "nodes"], "readwrite"),
  );
  const posts = tx.objectStore("posts");
  const feedmetadata = tx.objectStore("feedmetadata");
  const nodes = tx.objectStore("nodes");

  for (const feed of feedsToDelete) {
    posts.delete(IDBKeyRange.bound([feed.id], [feed.id + 1], false, true));
    feedmetadata.delete(feed.id);
    nodes.delete(feed.id);
  }
  for (const f of foldersToDelete) {
    nodes.delete(f.id);
  }

  try {
    await txDone(tx);
  } catch (e) {
    const msg =
      "Unable to delete the folder and its contents, please try again.";
    throw new DeletionError(msg, { cause: e });
  }
}
