import { getDBConnection } from "@/background/db-setup";
import { FeedUpdateError } from "@/background/utils/errors";
import { getHighestSortOrder } from "@/background/utils/nodes";

export async function updateFolder(
  id: number,
  name: string,
  parent: number | null,
) {
  using conn = await getDBConnection();

  const old = await conn.db.get("nodes", id);
  if (!old || old.type !== "folder") {
    throw new FeedUpdateError(
      "Unable to find the folder to be updated, it may have been deleted.",
      { cause: `folder-update: failure to get the folder id=${id}` },
    );
  }

  const updated = structuredClone(old);
  updated.name = name;
  updated.parentId = parent;
  if (updated.parentId && updated.parentId !== old.parentId) {
    const sortOrder = await getHighestSortOrder(conn.db, updated.parentId);
    updated.sortOrder = sortOrder;
  }
  await conn.db.put("nodes", updated);
}
