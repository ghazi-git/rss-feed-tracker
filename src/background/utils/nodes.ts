import { ExtensionDB } from "@/background/db-setup";

export async function getHighestSortOrder(db: ExtensionDB, folder: number) {
  const children = await db.getAllFromIndex(
    "nodes",
    "by_parent_id_sort_order",
    {
      query: IDBKeyRange.bound([folder, 0], [folder, Infinity]),
      count: 1,
      direction: "prev",
    },
  );
  const sortOrder = children[0]?.sortOrder ?? 0;
  return sortOrder + 10_000;
}
