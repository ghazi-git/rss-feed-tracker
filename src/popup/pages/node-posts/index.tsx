import { useParams, useSearchParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";

import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import NoPosts from "@/popup/components/NoPosts";
import BackLink from "@/popup/components/page-header/BackLink";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PageTitleButton from "@/popup/components/page-header/PageTitleButton";
import PostsFilter from "@/popup/pages/node/PostsFilter";
import Posts from "@/popup/pages/node-posts/Posts";
import { NODES, POSTS } from "@/popup/utils/dummy-data";

import styles from "./index.module.css";

export default function NodePosts() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const node = () => NODES.find((n) => n.id === parseInt(params.id));
  const allPosts = createMemo(() => {
    const currentNode = node();
    if (!currentNode) return [];

    let posts;
    if (currentNode.type === "folder") {
      const feedIds: number[] = [];
      const folderIds = [currentNode.id];
      while (folderIds.length > 0) {
        const folderId = folderIds.shift();
        const children = NODES.filter((n) => n.parentId === folderId);
        for (const child of children) {
          if (child.type === "folder") folderIds.push(child.id);
          else feedIds.push(child.id);
        }
      }
      posts = POSTS.filter((post) => feedIds.includes(post.feedId));
      posts = posts.map((post) => {
        const n = NODES.find((nd) => nd.id === post.feedId);
        return {
          ...post,
          feed: { name: n!.name, favicon: n!.feed!.favicon },
        };
      });
    } else {
      posts = POSTS.filter((post) => post.feedId === currentNode.id);
      posts = posts.map((post) => ({
        ...post,
        feed: { name: currentNode.name, favicon: currentNode.feed.favicon },
      }));
    }

    posts.sort((a, b) => b.publishedAt - a.publishedAt);
    return posts;
  });
  const filteredPosts = createMemo(() => {
    if (searchParams.unread === "true") {
      return allPosts().filter((post) => post.unread);
    } else {
      return allPosts();
    }
  });
  const noPostsMsg = () => {
    if (searchParams.unread === "true") {
      return "No unread posts";
    } else {
      return "No posts published yet";
    }
  };
  const previousUrl = () => {
    const currentNode = node();
    if (!currentNode) return "/library";

    if (currentNode.type === "folder") {
      return `/library/nodes/${currentNode.id}`;
    } else {
      return `/library/nodes/${currentNode.parentId}`;
    }
  };

  return (
    <Show when={node()} fallback={<h2>Feed/Folder not Found</h2>}>
      {(currentNode) => (
        <DeleteNodeProvider>
          <PageHeaderWrapper>
            <BackLink url={previousUrl()} class={styles["previous-url"]} />
            <PageTitleButton
              title={currentNode().name}
              nodeType={currentNode().type}
              nodeId={currentNode().id}
              nodeName={currentNode().name}
              isRoot={currentNode().parentId === null}
            />
            <Show when={allPosts().length > 0}>
              <PostsFilter
                unreadCount={currentNode().unreadCount}
                pageUrl={`/library/nodes/${currentNode().id}/posts`}
                initialFilter={
                  searchParams.unread === "true" ? "unread" : "all"
                }
                class={styles["posts-filter"]}
              />
            </Show>
          </PageHeaderWrapper>
          <Show
            when={filteredPosts().length > 0}
            fallback={<NoPosts msg={noPostsMsg()} />}
          >
            <Posts posts={filteredPosts()} />
          </Show>
          <DeleteNodeDialog />
        </DeleteNodeProvider>
      )}
    </Show>
  );
}
