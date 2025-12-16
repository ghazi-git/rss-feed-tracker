import { Show } from "solid-js";

import { Folder } from "@/background/db-setup";
import BackLink from "@/popup/components/page-header/BackLink";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PageTitleButton from "@/popup/components/page-header/PageTitleButton";
import PostsFilter from "@/popup/pages/node/PostsFilter";

import styles from "./FolderPageHeader.module.css";

export default function FolderPageHeader(props: FolderPageHeaderProps) {
  return (
    <PageHeaderWrapper>
      <Show
        when={props.folder.parentId}
        fallback={<div class={styles["previous-url-placeholder"]} />}
      >
        <BackLink
          url={`/library/nodes/${props.folder.parentId}`}
          class={styles["previous-url"]}
        />
      </Show>
      <PageTitleButton
        title={props.folder.name}
        nodeType={props.folder.type}
        nodeId={props.folder.id}
        nodeName={props.folder.name}
        isRoot={props.folder.parentId === null}
      />
      <Show when={props.hasChildren}>
        <PostsFilter
          unreadCount={props.folder.unreadCount}
          pageUrl={`/library/nodes/${props.folder.id}/posts`}
          initialFilter={null}
          class={styles["posts-filter"]}
        />
      </Show>
    </PageHeaderWrapper>
  );
}

interface FolderPageHeaderProps {
  folder: Folder;
  hasChildren: boolean;
}
