import FolderIcon from "@/popup/components/svg-icons/FolderIcon.jsx";
import RssIcon from "@/popup/components/svg-icons/RssIcon.jsx";
import ActionCard from "@/popup/pages/no-feeds-yet/ActionCard.jsx";
import { getSearchString } from "@/popup/utils/urls";

import styles from "./FolderNoChildren.module.css";

export default function FolderNoChildren(props) {
  const previousUrl = () =>
    getSearchString({ previousUrl: `/library/nodes/${props.folderId}` });

  return (
    <div class={styles["no-children"]}>
      <ActionCard text="Add Feed" href={`/library/feeds/add?${previousUrl()}`}>
        <RssIcon />
      </ActionCard>
      <ActionCard
        text="Add Folder"
        href={`/library/folders/add?${previousUrl()}`}
      >
        <FolderIcon />
      </ActionCard>
    </div>
  );
}
