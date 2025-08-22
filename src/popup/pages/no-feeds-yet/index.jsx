import { useNavigate } from "@solidjs/router";

import FolderIcon from "@/popup/components/svg-icons/FolderIcon.jsx";
import RssIcon from "@/popup/components/svg-icons/RssIcon.jsx";
import UploadIcon from "@/popup/components/svg-icons/UploadIcon.jsx";
import ActionCard from "@/popup/pages/no-feeds-yet/ActionCard.jsx";

import styles from "./index.module.css";

export default function NoFeedsYet() {
  const navigate = useNavigate();

  return (
    <div class={styles.container}>
      <div class={styles["add-feed-folder"]}>
        <ActionCard text="Add Feed" onClick={() => navigate("/add-feed")}>
          <RssIcon />
        </ActionCard>
        <ActionCard text="Add Folder" onClick={() => navigate("/add-folder")}>
          <FolderIcon />
        </ActionCard>
      </div>
      <ActionCard text="Import Feeds" onClick={() => navigate("/import-feeds")}>
        <UploadIcon />
      </ActionCard>
    </div>
  );
}
