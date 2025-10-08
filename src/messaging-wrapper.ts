import { batch } from "solid-js";
import { createStore } from "solid-js/store";

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
  const [store, setStore] = createStore<Mutation<K>>({
    status: "idle",
    data: null,
    errorMsg: null,
  });

  // separate is* function so that they can act as type guards
  function isLoading(store: Mutation<K>) {
    return store.status === "loading";
  }
  function isSuccess(store: Mutation<K>) {
    return store.status === "success";
  }
  function isError(store: Mutation<K>) {
    return store.status === "error";
  }
  async function sendMsg(payload: MessagePayload<K>) {
    batch(() => {
      setStore("status", "loading");
      setStore("data", null);
      setStore("errorMsg", null);
    });
    const response = await sendMessage(messageType, payload);
    if (response.success) {
      batch(() => {
        setStore("status", "success");
        setStore("data", response.data);
        setStore("errorMsg", null);
      });
    } else {
      batch(() => {
        setStore("status", "error");
        setStore("data", null);
        setStore("errorMsg", response.errorMsg);
      });
    }
  }

  return { store, isLoading, isSuccess, isError, sendMsg };
}

interface MutationIdle {
  status: "idle";
  data: null;
  errorMsg: null;
}

interface MutationLoading {
  status: "loading";
  data: null;
  errorMsg: null;
}

interface MutationSuccess<K extends MessageType> {
  status: "success";
  data: MessageData<K>;
  errorMsg: null;
}

interface MutationError {
  status: "error";
  data: null;
  errorMsg: string;
}

type Mutation<K extends MessageType> =
  | MutationIdle
  | MutationLoading
  | MutationSuccess<K>
  | MutationError;

interface MessageMap {
  // define only ONE argument for each method
  "feeds/preview"(data: { url: string }): FeedPreviewResponse;
  "feeds/add"(data: FeedFormData): { feedId: number };
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
