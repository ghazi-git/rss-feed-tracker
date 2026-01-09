import { Match, Show, Switch } from "solid-js";

import { PAGE_SIZE } from "@/background/settings";
import { PostsView } from "@/messaging-wrapper";
import ErrorAlert from "@/popup/components/ErrorAlert";
import LoadMorePosts from "@/popup/components/LoadMorePosts";
import NoMorePosts from "@/popup/components/NoMorePosts";
import NoPosts from "@/popup/components/NoPosts";
import Posts from "@/popup/pages/node-posts/Posts";

import { usePostsContext } from "./posts-context";

export default function PostList(props: PostListProps) {
  const { query, posts, fetchPosts } = usePostsContext();
  const postsCount = () => posts().length;

  return (
    <Switch>
      <Match when={postsCount() === 0 && query.isError}>
        <NoPosts msg={query.errorMsg!} />
      </Match>
      <Match when={postsCount() === 0 && query.isLoading}>
        <NoPosts msg="Loading posts..." />
      </Match>
      <Match when={postsCount() === 0}>
        <NoPosts
          msg={
            props.postsView === "all"
              ? "No posts yet."
              : "No unread posts found."
          }
        />
      </Match>
      <Match when={postsCount() > 0}>
        <ErrorAlert errorMsg={query.errorMsg} />
        <Posts posts={posts()} />
        <Show when={query.data.nextPageCursor}>
          <LoadMorePosts
            postsCount={postsCount()}
            loading={query.isLoading}
            onClick={() => {
              fetchPosts();
            }}
          />
        </Show>
        <Show when={!query.data.nextPageCursor && postsCount() >= PAGE_SIZE}>
          <NoMorePosts postsCount={postsCount()} />
        </Show>
      </Match>
    </Switch>
  );
}

interface PostListProps {
  nodeId: number;
  postsView: PostsView;
}
