import FolderIcon from "@/popup/components/svg-icons/FolderIcon.jsx";
import RssIcon from "@/popup/components/svg-icons/RssIcon.jsx";
import ActionCard from "@/popup/pages/no-feeds-yet/ActionCard.jsx";

import styles from "./FolderNoChildren.module.css";

export default function FolderNoChildren(props) {
  const previousUrl = () =>
    new URLSearchParams({ previousUrl: `/home/nodes/${props.folderId}` });

  return (
    <div class={styles["no-children"]}>
      <ActionCard
        text="Add Feed"
        href={`/add-feed?${previousUrl().toString()}`}
      >
        <RssIcon />
      </ActionCard>
      <ActionCard
        text="Add Folder"
        href={`/add-folder?${previousUrl().toString()}`}
      >
        <FolderIcon />
      </ActionCard>
    </div>
  );
}
