import { Post, TreeNode } from "@/db-setup";
import { OrderPostsBy } from "@/utils/extension-storage";

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
  const eventHandler = (
    message: MessageRequest<K>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: MessageResponse<K>) => void,
  ) => {
    if (message.type === messageType) {
      return messageCallback(message.payload, sender, sendResponse);
    }
  };

  chrome.runtime.onMessage.addListener(eventHandler);
  return () => {
    chrome.runtime.onMessage.removeListener(eventHandler);
  };
}

interface MessageMap {
  // define only ONE argument for each method
  "feeds/preview"(data: { url: string }): FeedPreviewResponse;
  "feeds/find"(): FeedFound[];
  "feeds/create"(data: FeedFormData): { feedId: number };
  "feeds/get"(data: { id: number }): FeedFormWithOptions;
  "feeds/update"(data: { id: number } & UpdateFeedFormData): void;
  "feeds/delete"(data: { id: number }): void;
  "feed-polling/notify-of-new-posts"(): void;
  "posts/get-unread-bookmarks-count"(): number;
  "posts/get-bookmarks"(data: BookmarkedPostsParams): PostsResponse;
  "posts/filter-bookmarks"(data: { query: string }): FilterResult[];
  "posts/list"(data: NodePostsParams): PostsResponse;
  "posts/filter"(data: PostsFilterParams): FilterResult[];
  "posts/toggle-unread"(data: ToggleUnreadParams): void;
  "posts/toggle-bookmarked"(data: ToggleBookmarkedParams): void;
  "posts/mark-all-bookmarks-as-read"(): void;
  "posts/mark-all-posts-as-read"(data: MarkAllPostsAsReadParams): void;
  "nodes/get-for-node-page"(data: { id: number }): NodeResponse;
  "nodes/get-for-node-posts-page"(data: { id: number }): NodePostsResponse;
  "nodes/get-options"(): NodeOptionsResponse;
  "nodes/reload"(data: { id: number }): NodeReloadResponse;
  "nodes/move-into-sibling-folder"(data: {
    nodeId: number;
    folderId: number;
  }): void;
  "nodes/move-relative-to-target"(data: {
    nodeId: number;
    targetId: number;
    placement: RelativePlacement;
  }): void;
  "folders/create"(data: FolderFormData): { folderId: number };
  "folders/options"(): FolderOption[];
  "folders/get-root"(): RootFolder;
  "folders/get"(data: { id: number }): FolderDataWithOptions;
  "folders/update"(data: FolderDataUpdate): void;
  "folders/delete"(data: { id: number }): void;
  "opml/import"(data: OPMLImportParams): void;
  "opml/trigger-export"(data: { folder: number }): void;
  "opml/trigger-root-export"(): void;
  "opml/export"(data: { folder: number }): void;
  "full-data/backup-trigger"(data: PreferencesData): void;
  "full-data/backup"(data: PreferencesData): void;
  "full-data/restore-trigger"(data: { fileURL: string }): PreferencesData;
  "full-data/restore"(data: { fileURL: string }): PreferencesData;
  "search-index/trigger-rebuild"(): void;
  "search-index/resume-rebuild"(data: SearchIndexProgressParams): void;
  "search-index/store-rebuild-progress"(data: SearchIndexProgressParams): void;
  "search-index/finish-rebuild"(data: SearchIndexRebuildingDone): string | null;
  "search-index/rebuild-progress-msg"(): string | null;
  "search-index/update"(data: { indexName: string }): void;
  "search-index/has-unapplied-operations"(): boolean;
  "search-index/trigger-query"(data: SearchQueryParams): SearchResult[];
  "search-index/query"(
    data: SearchQueryParams & { indexName: string },
  ): SearchResult[];
  "search-index/is-popup-open"(): boolean;
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
export interface FeedFound {
  url: string;
  title: string;
  description: string;
  subscribed: boolean;
}
export interface FeedFormData {
  url: string;
  name: string;
  frequency: number | null;
  folder: number;
}
export interface UpdateFeedFormData extends FeedFormData {
  iconURL: string;
}
interface FeedFormWithOptions extends UpdateFeedFormData {
  folderOptions: FolderOption[];
}
export interface BookmarkedPostsParams {
  postsView: PostsView;
  cursor: PostsCursor | null;
  pageSize?: number;
}
export type PostsView = "all" | "unread";
export interface FeedPost extends Post {
  feedName: string;
  feedFavicon: string | null;
}
export interface PostsResponse {
  posts: FeedPost[];
  nextPageCursor: PostsCursor | null;
}
export interface PostsCursor {
  time: number;
  feedId: number;
  guid: string;
}
export interface NodePostsParams {
  nodeId: number;
  postsView: PostsView;
  cursor: PostsCursor | null;
  pageSize?: number;
}
export interface PostsFilterParams {
  nodeId: number;
  query: string;
}
export interface FilterResult extends FeedPost {
  termPositions: TermPosition[];
}
export interface TermPosition {
  start: number;
  end: number;
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
export type NodePostsResponse = TreeNode & {
  markAsReadUntil: number;
  hasPosts: boolean;
};
export type NodeOptionsResponse = { label: string; value: number }[];
export interface NodeReloadResponse {
  newPostsCount: number;
  unreadCount: number;
  markAsReadUntil: number;
}
export type RelativePlacement = "reorder-before" | "reorder-after";
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
interface OPMLImportParams {
  folder: number;
  fileContent: string;
}
export interface PreferencesData {
  uiTheme: "light" | "dark" | null;
  defaultFeedUpdateFrequency: number | null;
  clickPostToToggleUnread: boolean;
  orderPostsBy: OrderPostsBy;
  groupFolderPosts: boolean;
}
export interface SearchIndexProgressParams {
  indexName: string;
  startTime: number;
  postsIndexedSoFar: number;
  totalPostsToBeIndexed: number;
  // if the rebuilding process is interrupted midway (due to closing the
  // browser, for example), we can pick up the work on the next extension startup
  currentCursor: SearchIndexProgressCursor;
  // by the time we finish rebuilding the index, there might be new posts
  // fetched by the extension in the background. So, the initialCursor allows
  // us to find all of them and trigger their indexing
  initialCursor: SearchIndexProgressCursor;
}
export interface SearchIndexProgressCursor {
  fetchedAt: number;
  feedId: number;
  guid: string;
}
interface SearchIndexRebuildingDone {
  indexName: string;
  initialCursor: SearchIndexProgressCursor;
}
export interface SearchQueryParams {
  query: string;
  nodeId: number | null;
  bookmarked: 0 | 1 | null;
}
export interface SearchResult extends FeedPost {
  // todo make required once highlighting is added
  highlightedTitle?: string;
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
