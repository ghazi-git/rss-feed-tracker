export interface BackupManifestV1 {
  backupVersion: 1;
  extensionName?: string;
  extensionVersion: string;
  createdAt?: string;
  preferences: {
    uiTheme: "light" | "dark" | null;
    defaultFeedUpdateFrequency: number;
    markNewPostsUnread: boolean;
    clickPostToToggleUnread: boolean;
  };
  backupFiles: {
    // contains data from the nodes and feedmetadata stores
    feeds_folders: JSONFilename;
    // contains data from the posts store. each file contains 20K posts (~10MB)
    posts: JSONFilename[];
  };
}

export type JSONFilename = `${string}.json`;

export interface FolderBackup {
  id: number;
  name: string;
  unreadCount: number;
  sortOrder: number;
  createdAt: number;
  type: "folder";
  parentId: number | null;
  feed: null;
}

export interface FeedBackup {
  id: number;
  name: string;
  unreadCount: number;
  sortOrder: number;
  createdAt: number;
  type: "feed";
  parentId: number;
  feed: {
    favicon: string | null;
    url: string;
    updateFrequency: number;
  };
}

export type NodeBackup = FolderBackup | FeedBackup;

export interface FeedMetadataBackup {
  feedId: number;
  nextRunAt: number | null;
  lastRunAt: number | null;
  lastRunResult: "success" | "failure" | null;
  lastRunNotes: string | null;
  lastSuccessfulRunAt: number | null;
  lastUpdatedAt: number | null;
}

export interface NodesBackupFile {
  nodes: NodeBackup[];
  feedmetadata: FeedMetadataBackup[];
}

export interface PostBackup {
  feedId: number;
  guid: string;
  title: string;
  url: string;
  publishedAt: number;
  commentsURL: string | null;
  unread: 0 | 1;
  bookmarked: 0 | 1;
  receivedAt: number;
}

export type PostsBackupFile = PostBackup[];
