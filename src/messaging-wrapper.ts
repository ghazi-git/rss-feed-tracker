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

interface MessageMap {
  // define only ONE argument for each method
  "feeds/preview"(data: { url: string }): FeedPreview;
}

export interface FeedPreview {
  feedName: string;
  posts: PostPreview[];
}
export interface PostPreview {
  title: string;
  url: string;
  publishedAt: number;
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
