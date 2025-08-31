import { useParams, useSearchParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";

import NodeHeader from "@/popup/pages/node/NodeHeader.jsx";
import Posts from "@/popup/pages/node-posts/Posts.jsx";
import { NODES, POSTS } from "@/popup/utils/dummy-data.js";

export default function NodePosts() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const node = () => NODES.find((n) => n.id === parseInt(params.id));
  const posts = createMemo(() => {
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

    if (searchParams.unread === "true") {
      posts = posts.filter((post) => post.unread);
    }

    posts.sort((a, b) => b.publishedAt - a.publishedAt);
    return posts;
  });

  return (
    <Show when={node()} fallback={<h2>Feed not Found</h2>}>
      <NodeHeader node={node()} />
      <Show
        when={posts().length > 0}
        fallback={<div>No posts published yet.</div>}
      >
        <Posts posts={posts()} />
      </Show>
    </Show>
  );
}
