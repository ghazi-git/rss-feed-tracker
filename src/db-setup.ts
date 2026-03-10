import {
  DBSchema,
  IDBPDatabase,
  IDBPTransaction,
  IndexNames,
  openDB,
  StoreNames,
} from "idb";

export const DB_NAME = "FeedTracker";
export async function getDBConnection(dbVersion: number | null = null) {
  const version = dbVersion ?? 1;
  const db = await openDB<FeedTrackerDB>(DB_NAME, version, {
    async upgrade(db) {
      if (!db.objectStoreNames.contains("nodes")) {
        const store = db.createObjectStore("nodes", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by_type", "type");
        store.createIndex("by_parent_id_sort_order", ["parentId", "sortOrder"]);
        store.createIndex("by_next_run_at", "feed.nextRunAt");
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
        store.createIndex("by_unread_fetched_at_feed_id_guid", [
          "unread",
          "fetchedAt",
          "feedId",
          "guid",
        ]);
        store.createIndex("by_unread_feed_id_fetched_at_guid", [
          "unread",
          "feedId",
          "fetchedAt",
          "guid",
        ]);
        store.createIndex("by_fetched_at_feed_id_guid", [
          "fetchedAt",
          "feedId",
          "guid",
        ]);
        store.createIndex("by_feed_id_fetched_at_guid", [
          "feedId",
          "fetchedAt",
          "guid",
        ]);
        store.createIndex("by_bookmarked_fetched_at_feed_id_guid", [
          "bookmarked",
          "fetchedAt",
          "feedId",
          "guid",
        ]);
        store.createIndex("by_bookmarked_unread_fetched_at_feed_id_guid", [
          "bookmarked",
          "unread",
          "fetchedAt",
          "feedId",
          "guid",
        ]);
      }
      if (!db.objectStoreNames.contains("searchIndexOperations")) {
        db.createObjectStore("searchIndexOperations", {
          keyPath: "id",
          autoIncrement: true,
        });
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
      // indexes for displaying posts ordered by fetchedAt
      by_fetched_at_feed_id_guid: [number, number, string];
      by_feed_id_fetched_at_guid: [number, number, string];
      by_bookmarked_fetched_at_feed_id_guid: [
        BooleanFlag,
        number,
        number,
        string,
      ];
      by_bookmarked_unread_fetched_at_feed_id_guid: [
        BooleanFlag,
        BooleanFlag,
        number,
        number,
        string,
      ];
      // for marking all posts inside a folder as read even if new posts are
      // coming in at the same time
      by_unread_fetched_at_feed_id_guid: [BooleanFlag, number, number, string];
      // for marking all posts inside a feed as read even if new posts are
      // coming in at the same time
      by_unread_feed_id_fetched_at_guid: [BooleanFlag, number, number, string];
    };
  };
  searchIndexOperations: {
    key: number;
    value: SearchIndexOperation;
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
    updateFrequency: number | null; // in ms since js unix timestamps are in ms
    nextRunAt: number | null; // helpful for filtering on due feeds
    lastRunAt: number | null; // last time we tried fetching posts whether it's successful or not
  };
}

export type TreeNode = Feed | Folder;

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
  // fetchedAt helps with marking all posts as read, especially that new posts
  // can arrive while the user is in the unread posts page
  fetchedAt: number;
}

// searchIndexOperations acts similar to a Write-Ahead Log, that will be used to
// sync the search index with the main store. When posts are added, updated
// or removed. A new entry is appended to the log.
interface BaseSearchIndexOperation {
  id: number; // auto-incrementing id
  createdAt: number;
  // feedId+guid identify the post
  feedId: number;
  guid: string;
}
interface PostDocument {
  title: string;
  bookmarked: BooleanFlag;
}
export interface SearchIndexAdd extends BaseSearchIndexOperation {
  operation: "add";
  document: PostDocument;
}
export interface SearchIndexUpdate extends BaseSearchIndexOperation {
  operation: "update";
  document: PostDocument;
}
export interface SearchIndexRemove extends BaseSearchIndexOperation {
  operation: "remove";
  document: null;
}
export type SearchIndexOperation =
  | SearchIndexAdd
  | SearchIndexUpdate
  | SearchIndexRemove;

type BooleanFlag = 0 | 1;
