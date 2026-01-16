import { saveFolder } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";
import { txDone } from "@/idb-helpers";
import { FolderFormData } from "@/messaging-wrapper";

export async function createFolder(data: FolderFormData) {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes"], "readwrite");

  const folder = await saveFolder(tx, data.name, data.parentFolder);
  await txDone(tx);

  return folder.id;
}
