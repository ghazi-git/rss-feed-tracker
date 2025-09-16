import FolderIcon from "@/popup/components/svg-icons/FolderIcon";
import RssIcon from "@/popup/components/svg-icons/RssIcon";
import UploadIcon from "@/popup/components/svg-icons/UploadIcon";
import ActionCard from "@/popup/pages/no-feeds-yet/ActionCard";

import styles from "./index.module.css";

export default function NoFeedsYet() {
  return (
    <div class={styles.container}>
      <div class={styles["add-feed-folder"]}>
        <ActionCard text="Add Feed" href="/library/feeds/add">
          <RssIcon />
        </ActionCard>
        <ActionCard text="Add Folder" href="/library/folders/add">
          <FolderIcon />
        </ActionCard>
      </div>
      <ActionCard text="Import Feeds" href="/library/feeds/import">
        <UploadIcon />
      </ActionCard>
    </div>
  );
}
