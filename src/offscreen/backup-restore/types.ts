import * as v from "valibot";

const JSONFilenameSchema = v.pipe(v.string(), v.endsWith(".json"));
export type JSONFilename = `${string}.json`;

const FrequencySchema = v.union(
  [
    v.literal(3_600_000),
    v.literal(7_200_000),
    v.literal(14_400_000),
    v.literal(21_600_000),
    v.literal(86_400_000),
  ],
  "The update frequency must be either 3600000 (1 hour), 7200000 (2 hours), 14400000 (4 hours), 21600000 (6 hours), 86400000 (1 day)",
);
export const BackupManifestSchema = v.object({
  backupVersion: v.literal(1, "backupVersion must be set to 1"),
  extensionName: v.optional(v.string("extensionName must be a string")),
  extensionVersion: v.string("extensionVersion must be a string"),
  createdAt: v.optional(
    v.string(
      "createdAt must a string representing when the backup was created",
    ),
  ),
  preferences: v.object({
    uiTheme: v.union(
      [v.literal("light"), v.literal("dark"), v.null()],
      "uiTheme must be either 'light', 'dark' or null",
    ),
    defaultFeedUpdateFrequency: FrequencySchema,
    markNewPostsUnread: v.boolean("markNewPostsUnread must be a boolean"),
    clickPostToToggleUnread: v.boolean(
      "clickPostToToggleUnread must be a boolean",
    ),
  }),
  backupFiles: v.object(
    {
      // contains data from the nodes and feedmetadata stores
      feeds_folders: v.message(
        JSONFilenameSchema,
        "feeds_folders must be a filename that ends with '.json'",
      ),
      // contains data from the posts store. each file contains 20K posts (~10MB)
      posts: v.array(
        JSONFilenameSchema,
        "posts must be an array of filenames that end with '.json'",
      ),
    },
    "backupFiles must be an object with 2 keys 'feeds_folders' and 'posts'",
  ),
});

// change frequency type from a union to number since the type in code is number
type InferredManifestV1 = v.InferOutput<typeof BackupManifestSchema>;
export type BackupManifestV1 = Omit<InferredManifestV1, "preferences"> & {
  preferences: Omit<
    InferredManifestV1["preferences"],
    "defaultFeedUpdateFrequency"
  > & { defaultFeedUpdateFrequency: number };
};

const IDSchema = v.pipe(v.number(), v.integer(), v.minValue(1));
const PositiveIntegerSchema = v.pipe(v.number(), v.integer(), v.minValue(0));
export const FolderBackupSchema = v.object({
  id: IDSchema,
  name: v.string(),
  unreadCount: PositiveIntegerSchema,
  sortOrder: PositiveIntegerSchema,
  createdAt: PositiveIntegerSchema,
  type: v.literal("folder"),
  parentId: v.union([IDSchema, v.null()]),
  feed: v.null(),
});

export type FolderBackup = v.InferOutput<typeof FolderBackupSchema>;

const URLSchema = v.pipe(v.string(), v.url());
export const FeedBackupSchema = v.object({
  id: IDSchema,
  name: v.string(),
  unreadCount: PositiveIntegerSchema,
  sortOrder: PositiveIntegerSchema,
  createdAt: PositiveIntegerSchema,
  type: v.literal("feed"),
  parentId: IDSchema,
  feed: v.object({
    favicon: v.union([URLSchema, v.null()]),
    url: URLSchema,
    updateFrequency: FrequencySchema,
  }),
});

// change frequency type from a union to number since the type in code is number
type InferredFeedBackup = v.InferOutput<typeof FeedBackupSchema>;
export type FeedBackup = Omit<InferredFeedBackup, "feed"> & {
  feed: Omit<InferredFeedBackup["feed"], "updateFrequency"> & {
    updateFrequency: number;
  };
};

export const NodeBackupSchema = v.union([FeedBackupSchema, FolderBackupSchema]);
export type NodeBackup = FolderBackup | FeedBackup;

export const FeedMetadataBackupSchema = v.object({
  feedId: IDSchema,
  nextRunAt: v.union([PositiveIntegerSchema, v.null()]),
  lastRunAt: v.union([PositiveIntegerSchema, v.null()]),
  lastRunResult: v.union([
    v.literal("success"),
    v.literal("failure"),
    v.null(),
  ]),
  lastRunNotes: v.union([v.string(), v.null()]),
  lastSuccessfulRunAt: v.union([PositiveIntegerSchema, v.null()]),
  lastUpdatedAt: v.union([PositiveIntegerSchema, v.null()]),
});
export type FeedMetadataBackup = v.InferOutput<typeof FeedMetadataBackupSchema>;

// we just validate the shape of file contents without requiring every object
// to have the correct schema. Later, we will validate each object and
// import only the ones that respect the expected schema
export const NodesBackupFileSchema = v.object(
  {
    nodes: v.array(
      v.record(v.string(), v.unknown()),
      "nodes must be an array of objects representing the feeds and folders",
    ),
    feedmetadata: v.array(
      v.record(v.string(), v.unknown()),
      "feedmetadata must be an array of objects representing the feeds metadata",
    ),
  },
  "The data in the feeds and folders file must be a json object with 2 keys 'nodes' and 'feedmetadata'",
);
export interface NodesBackupFile {
  nodes: NodeBackup[];
  feedmetadata: FeedMetadataBackup[];
}

export const PostBackupSchema = v.object({
  feedId: IDSchema,
  guid: v.string(),
  title: v.string(),
  url: URLSchema,
  publishedAt: PositiveIntegerSchema,
  commentsURL: v.union([URLSchema, v.null()]),
  unread: v.union([v.literal(0), v.literal(1)]),
  bookmarked: v.union([v.literal(0), v.literal(1)]),
  receivedAt: PositiveIntegerSchema,
});
export type PostBackup = v.InferOutput<typeof PostBackupSchema>;

export type PostsBackupFile = PostBackup[];
