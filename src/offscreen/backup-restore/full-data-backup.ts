import { getDBConnection } from "@/db-setup";
import { triggerFileDownload } from "@/offscreen/utils";

export async function backupExtension() {
  using conn = await getDBConnection();
  console.log("conn", conn.db);
  // create zip file
  // fetch nodes and feedmetadata
  // create a json string and add to zip
  // process posts:
  // - in chunks of 20K
  // - json stringify
  // - add to zip
  // - collect name
  // get uiTheme and preferences
  // generate manifest.json data
  // stringify and add to zip
  // trigger download

  const filename = `rss_feed_tracker_backup_${new Date().toISOString()}.zip`;
  triggerFileDownload(filename, "<fileContent>", "application/xml");
}
