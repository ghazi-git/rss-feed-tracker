import {
  DBSchema,
  IDBPDatabase,
  IDBPTransaction,
  IndexNames,
  openDB,
  StoreNames,
  StoreValue,
} from "idb";

export async function getDBConnection(dbVersion: number | null = null) {
  const version = dbVersion ?? 1;
  const db = await openDB<FeedTrackerDB>("FeedTracker", version, {
    async upgrade(db) {
      if (!db.objectStoreNames.contains("nodes")) {
        const store = db.createObjectStore("nodes", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by_type", "type");
        store.createIndex("by_parent_id_sort_order", ["parentId", "sortOrder"]);
        // insert the root folder
        const rootFolder = getRootFolderData();
        await store.add(rootFolder);
      }
      if (!db.objectStoreNames.contains("feedmetadata")) {
        const store = db.createObjectStore("feedmetadata", {
          keyPath: "feedId",
        });
        store.createIndex("by_next_run_at", "nextRunAt");
      }
      if (!db.objectStoreNames.contains("posts")) {
        const store = db.createObjectStore("posts", {
          keyPath: ["feedId", "guid"],
        });
        store.createIndex("by_published_at_feed_id_guid", [
          "publishedAt",
          "feedId",
          "guid",
        ]);
        store.createIndex("by_unread_published_at_feed_id_guid", [
          "unread",
          "publishedAt",
          "feedId",
          "guid",
        ]);
        store.createIndex("by_feed_id_published_at_guid", [
          "feedId",
          "publishedAt",
          "guid",
        ]);
        store.createIndex("by_unread_feed_id_published_at_guid", [
          "unread",
          "feedId",
          "publishedAt",
          "guid",
        ]);
        store.createIndex("by_bookmarked_published_at_feed_id_guid", [
          "bookmarked",
          "publishedAt",
          "feedId",
          "guid",
        ]);
        store.createIndex("by_bookmarked_unread_published_at_feed_id_guid", [
          "bookmarked",
          "unread",
          "publishedAt",
          "feedId",
          "guid",
        ]);
        store.createIndex("by_unread_received_at_feed_id_guid", [
          "unread",
          "receivedAt",
          "feedId",
          "guid",
        ]);
        store.createIndex("by_unread_feed_id_received_at_guid", [
          "unread",
          "feedId",
          "receivedAt",
          "guid",
        ]);
      }
      if (!db.objectStoreNames.contains("locks")) {
        db.createObjectStore("locks", { keyPath: "id" });
      }
    },
  });

  return {
    db,
    [Symbol.dispose]() {
      db.close();
    },
  };
}

export interface FeedTrackerDB extends DBSchema {
  nodes: {
    key: number;
    value: TreeNode;
    indexes: {
      // we need to get all folders to be displayed as select options
      by_type: "folder" | "feed";
      // to display feeds/folders sorted inside the parent folder
      by_parent_id_sort_order: [number, number];
    };
  };
  feedmetadata: {
    key: number;
    value: FeedMetadata;
    indexes: {
      // for identifying feeds that are due-fetching
      by_next_run_at: number;
    };
  };
  posts: {
    key: [number, string];
    value: Post;
    indexes: {
      // for displaying all posts sorted in folders. feedId+guid are needed for
      // handling pagination correctly
      by_published_at_feed_id_guid: [number, number, string];
      // for displaying all unread posts sorted in folders
      by_unread_published_at_feed_id_guid: [
        BooleanFlag,
        number,
        number,
        string,
      ];
      // for displaying all posts sorted inside a feed
      by_feed_id_published_at_guid: [number, number, string];
      // for displaying all unread posts sorted inside a feed
      by_unread_feed_id_published_at_guid: [
        BooleanFlag,
        number,
        number,
        string,
      ];
      // for displaying all bookmarked posts sorted
      by_bookmarked_published_at_feed_id_guid: [
        BooleanFlag,
        number,
        number,
        string,
      ];
      // for displaying all bookmarked unread posts sorted
      by_bookmarked_unread_published_at_feed_id_guid: [
        BooleanFlag,
        BooleanFlag,
        number,
        number,
        string,
      ];
      // for marking all posts inside a folder as read even if new posts are
      // coming in at the same time
      by_unread_received_at_feed_id_guid: [BooleanFlag, number, number, string];
      // for marking all posts inside a feed as read even if new posts are
      // coming in at the same time
      by_unread_feed_id_received_at_guid: [BooleanFlag, number, number, string];
    };
  };
  locks: {
    key: string;
    value: Lock;
  };
}

export type ExtensionDB = IDBPDatabase<FeedTrackerDB>;
export type ExtStoreName = StoreNames<FeedTrackerDB>;
export type ExtIndexName<Name extends ExtStoreName> = IndexNames<
  FeedTrackerDB,
  Name
>;
// must use arrays when creating a transaction so it corresponds to the below
// TX types `db.transaction(["nodes"])`, and not `db.transaction("nodes")`
export type ReadTX = IDBPTransaction<FeedTrackerDB, ExtStoreName[]>;
export type ReadWriteTX = IDBPTransaction<
  FeedTrackerDB,
  ExtStoreName[],
  "readwrite"
>;
export type ExtStoreValue<Name extends ExtStoreName> = StoreValue<
  FeedTrackerDB,
  Name
>;
export type PrimaryKey<Name extends ExtStoreName> = FeedTrackerDB[Name]["key"];

export async function createRootFolder(db: ExtensionDB): Promise<Folder> {
  const root = getRootFolderData();
  const folderId = await db.add("nodes", root);
  return { ...root, id: folderId };
}

function getRootFolderData() {
  // type casting because idb does not handle the case where the id is set
  // by indexeddb https://github.com/jakearchibald/idb/issues/150
  return {
    type: "folder",
    name: "My Feeds",
    parentId: null,
    createdAt: Date.now(),
    unreadCount: 0,
    sortOrder: 10_000,
    feed: null,
  } as Folder;
}

// a node is a feed or a folder, having them stored together makes it easier
// to update their ordering and later display them sorted within a folder.
interface BaseNode {
  id: number;
  name: string;
  unreadCount: number;
  sortOrder: number; // node ordering within a folder
  createdAt: number; // unix timestamp
}

export interface Folder extends BaseNode {
  type: "folder";
  parentId: number | null;
  feed: null;
}

export interface Feed extends BaseNode {
  type: "feed";
  parentId: number;
  feed: {
    favicon: string | null; // favicon url
    url: string;
    updateFrequency: number; // in ms since js unix timestamps are in ms
  };
}

export type TreeNode = Feed | Folder;

export interface FeedMetadata {
  feedId: number; // primary key to guarantee one entry per feed
  nextRunAt: number | null; // helpful for filtering on due feeds
  lastRunAt: number | null; // last time we tried fetching posts whether it's successful or not
  lastRunResult: "success" | "failure" | null;
  // lastRunNotes contains the failure reason or any notes/warnings during a successful run
  lastRunNotes: string | null;
  lastSuccessfulRunAt: number | null; // last time we got a successful response from the rss feed
  lastUpdatedAt: number | null; // last time new posts were fetched
}

export interface Post {
  // feedId+guid are the primary key. The idea is to offload figuring out new posts
  // from existing ones to the db. When getting new posts, we'll use `store.add`
  // and let the db refuse inserting posts with the same feedID+guid.
  feedId: number;
  guid: string;
  title: string;
  url: string;
  publishedAt: number;
  // for the RSS  format only (example hackerNews comments links)
  commentsURL: string | null;
  // can't use booleans since they can't be indexed
  unread: BooleanFlag;
  bookmarked: BooleanFlag;
  // receivedAt might help with marking all read especially that new posts can
  // arrive while the user is viewing at the unread files
  receivedAt: number;
}

export interface Lock {
  // we can acquire a lock by creating a new object with a specific id
  // using `store.add()`, if the creation fails with a ConstraintError,
  // then the lock has already been acquired. If a lock is too old (based
  // on createdAt), it can be forcibly released by deleting the entry.
  id: string;
  createdAt: number;
}

type BooleanFlag = 0 | 1;
