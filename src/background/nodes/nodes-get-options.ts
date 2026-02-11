import { getNodeTree, getOptions } from "@/background/folders/folders-options";
import { getDBConnection } from "@/db-setup";
import { NodeOptionsResponse } from "@/messaging-wrapper";

export async function getNodeOptions(): Promise<NodeOptionsResponse> {
  using conn = await getDBConnection();

  const nodes = await conn.db.getAll("nodes");
  const rootFolder = nodes
    .filter((n) => n.type === "folder")
    .find((n) => n.parentId === null);
  if (!rootFolder) return [];

  const orderedNodes = getNodeTree(rootFolder, nodes);
  return getOptions(orderedNodes);
}
