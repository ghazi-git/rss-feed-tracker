import { createRootFolder, getDBConnection } from "@/background/db-setup";
import { RootFolder } from "@/messaging-wrapper";

export async function getRootFolder(): Promise<RootFolder> {
  using conn = await getDBConnection();

  const nodes = await conn.db.getAll("nodes");
  const rootFolder = nodes
    .filter((f) => f.type === "folder")
    .find((f) => f.parentId === null);

  if (rootFolder) {
    const childNode = nodes.find((n) => n.parentId === rootFolder.id);
    return { id: rootFolder.id, hasChildNodes: !!childNode };
  } else {
    const root = await createRootFolder(conn.db);
    return { id: root.id, hasChildNodes: false };
  }
}
