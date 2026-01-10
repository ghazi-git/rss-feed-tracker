import { createStore } from "solid-js/store";

import {
  MessagePayload,
  PostsResponse,
  sendMessage,
} from "@/messaging-wrapper";

export function createPostsQuery<
  K extends "posts/list" | "posts/get-bookmarks",
>(messageType: K, source: () => MessagePayload<K>) {
  const [query, setQuery] = createStore<PostsQuery>({
    status: "idle",
    data: { posts: [], nextPageCursor: null },
    errorMsg: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  async function sendMsg(payload: MessagePayload<K>) {
    setQuery(({ data }) => ({
      status: "loading",
      data,
      errorMsg: null,
      isLoading: true,
      isSuccess: false,
      isError: false,
    }));
    const resp = await sendMessage(messageType, payload);
    if (resp.success) {
      setQuery({
        status: "success",
        data: resp.data,
        errorMsg: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
      });
    } else {
      setQuery(({ data }) => ({
        status: "error",
        data,
        errorMsg: resp.errorMsg,
        isLoading: false,
        isSuccess: false,
        isError: true,
      }));
    }
  }

  const fetchPosts = async () => {
    await sendMsg(source());
  };

  return { query, fetchPosts };
}

interface QueryIdle {
  status: "idle";
  data: PostsResponse;
  errorMsg: null;
  isLoading: false;
  isSuccess: false;
  isError: false;
}

interface QueryLoading {
  status: "loading";
  data: PostsResponse;
  errorMsg: null;
  isLoading: true;
  isSuccess: false;
  isError: false;
}

interface QuerySuccess {
  status: "success";
  data: PostsResponse;
  errorMsg: null;
  isLoading: false;
  isSuccess: true;
  isError: false;
}

interface QueryError {
  status: "error";
  data: PostsResponse;
  errorMsg: string;
  isLoading: false;
  isSuccess: false;
  isError: true;
}

export type PostsQuery = QueryIdle | QueryLoading | QuerySuccess | QueryError;
