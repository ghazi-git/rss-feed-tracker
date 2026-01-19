import { saveFolder } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";
import { FolderFormData } from "@/messaging-wrapper";
import { txDone } from "@/utils/idb-helpers";

export async function createFolder(data: FolderFormData) {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes"], "readwrite");

  const folder = await saveFolder(tx, data.name, data.parentFolder);
  await txDone(tx);

  return folder.id;
}
