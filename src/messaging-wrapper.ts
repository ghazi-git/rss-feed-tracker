import { Post, TreeNode } from "@/background/db-setup";

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
  "feeds/preview"(data: { url: string }): FeedPreviewResponse;
  "feeds/create"(data: FeedFormData): { feedId: number };
  "feeds/get"(data: { id: number }): FeedFormWithOptions;
  "feeds/update"(data: { id: number } & FeedFormData): void;
  "feeds/delete"(data: { id: number }): void;
  "posts/get-unread-bookmarks-count"(): number;
  "posts/get-bookmarks"(data: BookmarkedPostsParams): PostsResponse;
  "posts/toggle-unread"(data: ToggleUnreadParams): void;
  "posts/toggle-bookmarked"(data: ToggleBookmarkedParams): void;
  "posts/mark-all-bookmarks-as-read"(): void;
  "posts/mark-all-posts-as-read"(data: MarkAllPostsAsReadParams): void;
  "nodes/get"(data: { id: number }): NodeResponse;
  "folders/create"(data: FolderFormData): { folderId: number };
  "folders/options"(): FolderOption[];
  "folders/get-root"(): RootFolder;
  "folders/get"(data: { id: number }): FolderDataWithOptions;
  "folders/update"(data: FolderDataUpdate): void;
  "folders/delete"(data: { id: number }): void;
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
interface FeedFormWithOptions extends FeedFormData {
  folderOptions: FolderOption[];
}
export interface BookmarkedPostsParams {
  postsView: PostsView;
  cursor: PostsCursor | null;
}
export type PostsView = "all" | "unread";
export interface FeedPost extends Post {
  feedName: string;
  feedFavicon: string | null;
}
export interface PostsResponse {
  posts: FeedPost[];
  postsView: PostsView;
  cursor: PostsCursor | null;
  nextPageCursor: PostsCursor | null;
}
export interface PostsCursor {
  publishedAt: number;
  feedId: number;
  guid: string;
}
interface ToggleUnreadParams {
  feedId: number;
  guid: string;
  unread: boolean;
}
interface ToggleBookmarkedParams {
  feedId: number;
  guid: string;
  bookmarked: boolean;
}
interface MarkAllPostsAsReadParams {
  nodeId: number;
  markAsReadUntil: number;
}
export type NodeResponse = TreeNode & {
  markAsReadUntil: number;
  children: (TreeNode & { markAsReadUntil: number })[];
};
export type RootFolder = { id: number; hasChildNodes: boolean };
export interface FolderFormData {
  name: string;
  parentFolder: number;
}

export interface FolderOption {
  value: number;
  label: string;
}
interface FolderDataWithOptions {
  name: string;
  parentFolder: number | null;
  folderOptions: FolderOption[];
}
interface FolderDataUpdate {
  id: number;
  name: string;
  parentFolder: number | null;
}

export type MessageType = keyof MessageMap;
// assume only one argument is going to contain the payload
export type MessagePayload<K extends MessageType> = Parameters<
  MessageMap[K]
>[0];
type MessageRequest<K extends MessageType> = {
  type: K;
  payload: MessagePayload<K>;
};
// every message response will have success, data and errorMsg
export type MessageData<K extends MessageType> = ReturnType<MessageMap[K]>;
type MessageResponse<K extends MessageType> =
  | { success: true; data: MessageData<K>; errorMsg: null }
  | { success: false; data: null; errorMsg: string };
type MessageCallback<K extends MessageType> = (
  payload: MessagePayload<K>,
  sender: chrome.runtime.MessageSender,
  sendResponse: (resp: MessageResponse<K>) => void,
) => true | void;
