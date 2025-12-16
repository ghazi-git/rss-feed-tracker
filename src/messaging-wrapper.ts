import { createStore } from "solid-js/store";

import { TreeNode } from "@/background/db-setup";

export async function sendMessage<K extends MessageType>(
  messageType: K,
  args: MessagePayload<K>,
) {
  const response: MessageResponse<K> = await chrome.runtime.sendMessage({
    type: messageType,
    payload: args,
  });
  return response;
}

export function onMessage<K extends MessageType>(
  messageType: K,
  messageCallback: MessageCallback<K>,
) {
  chrome.runtime.onMessage.addListener(
    (message: MessageRequest<K>, sender, sendResponse) => {
      if (message.type === messageType) {
        return messageCallback(message.payload, sender, sendResponse);
      }
    },
  );
}

export function createMutation<K extends MessageType>(messageType: K) {
  const [mutation, setStore] = createStore<Mutation<K>>({
    status: "idle",
    data: null,
    errorMsg: null,
    isIdle: true,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  async function sendMsg(payload: MessagePayload<K>) {
    setStore({
      status: "loading",
      data: null,
      errorMsg: null,
      isIdle: false,
      isLoading: true,
      isSuccess: false,
      isError: false,
    });
    const response = await sendMessage(messageType, payload);
    if (response.success) {
      setStore({
        status: "success",
        data: response.data,
        errorMsg: null,
        isIdle: false,
        isLoading: false,
        isSuccess: true,
        isError: false,
      });
    } else {
      setStore({
        status: "error",
        data: null,
        errorMsg: response.errorMsg,
        isIdle: false,
        isLoading: false,
        isSuccess: false,
        isError: true,
      });
    }
  }
  function reset() {
    setStore({
      status: "idle",
      data: null,
      errorMsg: null,
      isIdle: true,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }

  return { mutation, sendMsg, reset };
}

interface MutationIdle {
  status: "idle";
  data: null;
  errorMsg: null;
  isIdle: true;
  isLoading: false;
  isSuccess: false;
  isError: false;
}

interface MutationLoading {
  status: "loading";
  data: null;
  errorMsg: null;
  isIdle: false;
  isLoading: true;
  isSuccess: false;
  isError: false;
}

interface MutationSuccess<K extends MessageType> {
  status: "success";
  data: MessageData<K>;
  errorMsg: null;
  isIdle: false;
  isLoading: false;
  isSuccess: true;
  isError: false;
}

interface MutationError {
  status: "error";
  data: null;
  errorMsg: string;
  isIdle: false;
  isLoading: false;
  isSuccess: false;
  isError: true;
}

type Mutation<K extends MessageType> =
  | MutationIdle
  | MutationLoading
  | MutationSuccess<K>
  | MutationError;

interface MessageMap {
  // define only ONE argument for each method
  "feeds/preview"(data: { url: string }): FeedPreviewResponse;
  "feeds/create"(data: FeedFormData): { feedId: number };
  "feeds/get"(data: { id: number }): FeedFormData;
  "feeds/update"(data: { id: number } & FeedFormData): void;
  "feeds/delete"(data: { id: number }): void;
  "nodes/get"(data: { id: number }): NodeResponse;
}

export interface FeedPreviewResponse {
  feedName: string;
  posts: PostPreview[];
}
export interface PostPreview {
  title: string;
  url: string;
  publishedAt: number;
}
export interface FeedFormData {
  url: string;
  name: string;
  frequency: number;
  folder: number;
}
export type NodeResponse = TreeNode & { children: TreeNode[] };

type MessageType = keyof MessageMap;
// assume only one argument is going to contain the payload
type MessagePayload<K extends MessageType> = Parameters<MessageMap[K]>[0];
type MessageRequest<K extends MessageType> = {
  type: K;
  payload: MessagePayload<K>;
};
// every message response will have success, data and errorMsg
type MessageData<K extends MessageType> = ReturnType<MessageMap[K]>;
type MessageResponse<K extends MessageType> =
  | { success: true; data: MessageData<K>; errorMsg: null }
  | { success: false; data: null; errorMsg: string };
type MessageCallback<K extends MessageType> = (
  payload: MessagePayload<K>,
  sender: chrome.runtime.MessageSender,
  sendResponse: (resp: MessageResponse<K>) => void,
) => true | void;
