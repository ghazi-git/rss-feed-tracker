import FolderIcon from "@/popup/components/svg-icons/FolderIcon.jsx";
import RssIcon from "@/popup/components/svg-icons/RssIcon.jsx";
import UploadIcon from "@/popup/components/svg-icons/UploadIcon.jsx";
import ActionCard from "@/popup/pages/no-feeds-yet/ActionCard.jsx";

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
