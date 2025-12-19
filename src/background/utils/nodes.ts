import { ExtensionDB } from "@/background/db-setup";

export async function getHighestSortOrder(db: ExtensionDB, folder: number) {
  try {
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
  } catch (e) {
    // no need for the user to know about an issue they can't fix
    // we'll go with the initial value
    console.error("node-sort-order: failure to determine the sort order", e);
    return 10_000;
  }
}
