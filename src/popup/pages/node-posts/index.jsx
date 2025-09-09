import { useParams, useSearchParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";

import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context.jsx";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog.jsx";
import NoPosts from "@/popup/components/NoPosts.jsx";
import BackLink from "@/popup/components/page-header/BackLink.jsx";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper.jsx";
import PageTitleButton from "@/popup/components/page-header/PageTitleButton.jsx";
import PostsFilter from "@/popup/pages/node/PostsFilter.jsx";
import Posts from "@/popup/pages/node-posts/Posts.jsx";
import { NODES, POSTS } from "@/popup/utils/dummy-data.js";

import styles from "./index.module.css";

export default function NodePosts() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const node = () => NODES.find((n) => n.id === parseInt(params.id));
  const allPosts = createMemo(() => {
    if (!node()) return [];

    let posts;
    if (node().type === "folder") {
      const feedIds = [];
      const folderIds = [node().id];
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
          feed: { name: n.name, favicon: n.feed.favicon },
        };
      });
    } else {
      posts = POSTS.filter((post) => post.feedId === node().id);
      posts = posts.map((post) => ({
        ...post,
        feed: { name: node().name, favicon: node().feed.favicon },
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
    if (node().type === "folder") {
      return `/home/nodes/${node().id}`;
    } else {
      return `/home/nodes/${node().parentId}`;
    }
  };

  return (
    <Show when={node()} fallback={<h2>Feed/Folder not Found</h2>}>
      <DeleteNodeProvider>
        <PageHeaderWrapper>
          <BackLink url={previousUrl()} class={styles["previous-url"]} />
          <PageTitleButton
            title={node().name}
            nodeType={node().type}
            nodeId={node().id}
            nodeName={node().name}
            isRoot={node().parentId === null}
          />
          <Show when={allPosts().length > 0}>
            <PostsFilter
              unreadCount={node().unreadCount}
              pageUrl={`/home/nodes/${node().id}/posts`}
              initialFilter={searchParams.unread === "true" ? "unread" : "all"}
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
    </Show>
  );
}
