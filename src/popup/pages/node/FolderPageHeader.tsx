import { Show } from "solid-js";

import { Folder } from "@/db-setup";
import BackLink from "@/popup/components/page-header/BackLink";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PageTitleButton from "@/popup/components/page-header/PageTitleButton";
import { useNodeContext } from "@/popup/pages/node/node-context";
import PostsFilter from "@/popup/pages/node/PostsFilter";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./FolderPageHeader.module.css";

export default function FolderPageHeader(props: FolderPageHeaderProps) {
  const { mutateNode } = useNodeContext();
  const { mutation, sendMsg } = createMutation("posts/mark-all-posts-as-read");
  const markAsReadMutation = {
    async markAll() {
      await sendMsg({
        nodeId: props.folder.id,
        markAsReadUntil: props.folder.markAsReadUntil,
      });
      if (mutation.isSuccess) {
        // set the unread count of the folder and all its children to 0
        mutateNode((resp) => {
          const children = resp.children.map((c) => ({ ...c, unreadCount: 0 }));
          return { ...resp, unreadCount: 0, children };
        });
      } else if (mutation.isError) {
        notifyError(mutation.errorMsg);
      }
    },

    isLoading() {
      return mutation.isLoading;
    },
  };

  return (
    <PageHeaderWrapper sticky={true}>
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
        parentFolderId={props.folder.parentId}
      />
      <Show when={props.hasChildren}>
        <PostsFilter
          unreadCount={props.folder.unreadCount}
          pageUrl={`/library/nodes/${props.folder.id}/posts`}
          postsView={null}
          class={styles["posts-filter"]}
          markAsReadMutation={markAsReadMutation}
        />
      </Show>
    </PageHeaderWrapper>
  );
}

interface FolderPageHeaderProps {
  folder: Folder & { markAsReadUntil: number };
  hasChildren: boolean;
}
