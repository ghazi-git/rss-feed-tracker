import FolderIcon from "@/popup/components/svg-icons/FolderIcon";
import RssIcon from "@/popup/components/svg-icons/RssIcon";
import ActionCard from "@/popup/pages/no-feeds-yet/ActionCard";
import { getSearchString } from "@/popup/utils/urls";

import styles from "./FolderNoChildren.module.css";

export default function FolderNoChildren(props: { folderId: number }) {
  const previousUrl = () =>
    getSearchString({
      previousUrl: `/library/nodes/${props.folderId}`,
      parentFolderId: `${props.folderId}`,
    });

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
