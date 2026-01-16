import { unwrap } from "idb";

import { txDone } from "@/background/utils/idb-helpers";
import { saveFolder } from "@/background/utils/nodes";
import { getDBConnection } from "@/db-setup";
import { FolderFormData } from "@/messaging-wrapper";

export async function createFolder(data: FolderFormData) {
  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes"], "readwrite");

  const folder = await saveFolder(tx, data.name, data.parentFolder);
  await txDone(unwrap(tx));

  return folder.id;
}
