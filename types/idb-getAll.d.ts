/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  DBSchema,
  IndexKey,
  IndexNames,
  StoreKey,
  StoreNames,
  StoreValue,
} from "idb";

declare module "idb" {
  /**
   * The new options interface for `IDBObjectStore.getAll`, `IDBObjectStore.getAllKeys` and
   * `IDBObjectStore.getAllRecords` supported in chrome/edge 141 or newer.
   *
   * @template DBTypes DB schema type, or unknown if the DB isn't typed.
   * @template StoreName Names of the object stores to get the types of.
   */
  export interface IDBPStoreGetAllOptions<
    DBTypes extends DBSchema | unknown,
    StoreName extends StoreNames<DBTypes>,
  > {
    query?: StoreKey<DBTypes, StoreName> | IDBKeyRange | null;
    count?: number;
    direction?: "next" | "prev";
  }

  /**
   * The new options interface for `IDBIndex.getAll`, `IDBIndex.getAllKeys` and
   * `IDBIndex.getAllRecords` supported in chrome/edge 141 or newer.
   *
   * @template DBTypes DB schema type, or unknown if the DB isn't typed.
   * @template StoreName Names of the object stores to get the types of.
   * @template IndexName Names of the indexes to get the types of.
   */
  export interface IDBPIndexGetAllOptions<
    DBTypes extends DBSchema | unknown,
    StoreName extends StoreNames<DBTypes>,
    IndexName extends IndexNames<DBTypes, StoreName>,
  > {
    query?: IndexKey<DBTypes, StoreName, IndexName> | IDBKeyRange | null;
    count?: number;
    direction?: IDBCursorDirection;
  }

  type IDBPDatabaseExtends = Omit<
    IDBDatabase,
    | "createObjectStore"
    | "deleteObjectStore"
    | "transaction"
    | "objectStoreNames"
  >;
  interface IDBPDatabase<DBTypes extends DBSchema | unknown = unknown>
    extends IDBPDatabaseExtends {
    /**
     * Retrieves all values in a store that match the query.
     * Supported in chrome/edge 141 or newer.
     *
     * This is a shortcut that creates a transaction for this single action. If you need to do more
     * than one action, create a transaction instead.
     *
     * @param storeName Name of the store.
     * @param options
     */
    getAll<Name extends StoreNames<DBTypes>>(
      storeName: Name,
      options?: IDBPStoreGetAllOptions<DBTypes, Name>,
    ): Promise<StoreValue<DBTypes, Name>[]>;
    /**
     * Retrieves all values in a store that match the query.
     *
     * This is a shortcut that creates a transaction for this single action. If you need to do more
     * than one action, create a transaction instead.
     *
     * @param storeName Name of the store.
     * @param query
     * @param count Maximum number of values to return.
     */
    getAll<Name extends StoreNames<DBTypes>>(
      storeName: Name,
      query?: StoreKey<DBTypes, Name> | IDBKeyRange | null,
      count?: number,
    ): Promise<StoreValue<DBTypes, Name>[]>;
    /**
     * Retrieves all values in an index that match the query.
     * Supported in chrome/edge 141 or newer.
     *
     * This is a shortcut that creates a transaction for this single action. If you need to do more
     * than one action, create a transaction instead.
     *
     * @param storeName Name of the store.
     * @param indexName Name of the index within the store.
     * @param options
     */
    getAllFromIndex<
      Name extends StoreNames<DBTypes>,
      IndexName extends IndexNames<DBTypes, Name>,
    >(
      storeName: Name,
      indexName: IndexName,
      options?: IDBPIndexGetAllOptions<DBTypes, Name, IndexName>,
    ): Promise<StoreValue<DBTypes, Name>[]>;
    /**
     * Retrieves all values in an index that match the query.
     *
     * This is a shortcut that creates a transaction for this single action. If you need to do more
     * than one action, create a transaction instead.
     *
     * @param storeName Name of the store.
     * @param indexName Name of the index within the store.
     * @param query
     * @param count Maximum number of values to return.
     */
    getAllFromIndex<
      Name extends StoreNames<DBTypes>,
      IndexName extends IndexNames<DBTypes, Name>,
    >(
      storeName: Name,
      indexName: IndexName,
      query?: IndexKey<DBTypes, Name, IndexName> | IDBKeyRange | null,
      count?: number,
    ): Promise<StoreValue<DBTypes, Name>[]>;
    /**
     * Retrieves the keys of records in a store matching the query.
     * Supported in chrome/edge 141 or newer.
     *
     * This is a shortcut that creates a transaction for this single action. If you need to do more
     * than one action, create a transaction instead.
     *
     * @param storeName Name of the store.
     * @param options
     */
    getAllKeys<Name extends StoreNames<DBTypes>>(
      storeName: Name,
      options?: IDBPStoreGetAllOptions<DBTypes, Name>,
    ): Promise<StoreKey<DBTypes, Name>[]>;
    /**
     * Retrieves the keys of records in a store matching the query.
     *
     * This is a shortcut that creates a transaction for this single action. If you need to do more
     * than one action, create a transaction instead.
     *
     * @param storeName Name of the store.
     * @param query
     * @param count Maximum number of keys to return.
     */
    getAllKeys<Name extends StoreNames<DBTypes>>(
      storeName: Name,
      query?: StoreKey<DBTypes, Name> | IDBKeyRange | null,
      count?: number,
    ): Promise<StoreKey<DBTypes, Name>[]>;
    /**
     * Retrieves the keys of records in an index matching the query.
     * Supported in chrome/edge 141 or newer.
     *
     * This is a shortcut that creates a transaction for this single action. If you need to do more
     * than one action, create a transaction instead.
     *
     * @param storeName Name of the store.
     * @param indexName Name of the index within the store.
     * @param options
     */
    getAllKeysFromIndex<
      Name extends StoreNames<DBTypes>,
      IndexName extends IndexNames<DBTypes, Name>,
    >(
      storeName: Name,
      indexName: IndexName,
      options?: IDBPIndexGetAllOptions<DBTypes, Name, IndexName>,
    ): Promise<StoreKey<DBTypes, Name>[]>;
    /**
     * Retrieves the keys of records in an index matching the query.
     *
     * This is a shortcut that creates a transaction for this single action. If you need to do more
     * than one action, create a transaction instead.
     *
     * @param storeName Name of the store.
     * @param indexName Name of the index within the store.
     * @param query
     * @param count Maximum number of keys to return.
     */
    getAllKeysFromIndex<
      Name extends StoreNames<DBTypes>,
      IndexName extends IndexNames<DBTypes, Name>,
    >(
      storeName: Name,
      indexName: IndexName,
      query?: IndexKey<DBTypes, Name, IndexName> | IDBKeyRange | null,
      count?: number,
    ): Promise<StoreKey<DBTypes, Name>[]>;
  }

  type IDBPObjectStoreExtends = Omit<
    IDBObjectStore,
    | "transaction"
    | "add"
    | "clear"
    | "count"
    | "createIndex"
    | "delete"
    | "get"
    | "getAll"
    | "getAllKeys"
    | "getKey"
    | "index"
    | "openCursor"
    | "openKeyCursor"
    | "put"
    | "indexNames"
  >;
  export interface IDBPObjectStore<
    DBTypes extends DBSchema | unknown = unknown,
    TxStores extends ArrayLike<StoreNames<DBTypes>> = ArrayLike<
      StoreNames<DBTypes>
    >,
    StoreName extends StoreNames<DBTypes> = StoreNames<DBTypes>,
    Mode extends IDBTransactionMode = "readonly",
  > extends IDBPObjectStoreExtends {
    /**
     * Retrieves all values that match the query.
     * Supported in chrome/edge 141 or newer.
     *
     * @param options
     */
    getAll(
      options?: IDBPStoreGetAllOptions<DBTypes, StoreName>,
    ): Promise<StoreValue<DBTypes, StoreName>[]>;
    /**
     * Retrieves all values that match the query.
     *
     * @param query
     * @param count Maximum number of values to return.
     */
    getAll(
      query?: StoreKey<DBTypes, StoreName> | IDBKeyRange | null,
      count?: number,
    ): Promise<StoreValue<DBTypes, StoreName>[]>;
    /**
     * Retrieves the keys of records matching the query.
     * Supported in chrome/edge 141 or newer.
     *
     * @param options
     */
    getAllKeys(
      options?: IDBPStoreGetAllOptions<DBTypes, StoreName>,
    ): Promise<StoreKey<DBTypes, StoreName>[]>;
    /**
     * Retrieves the keys of records matching the query.
     *
     * @param query
     * @param count Maximum number of keys to return.
     */
    getAllKeys(
      query?: StoreKey<DBTypes, StoreName> | IDBKeyRange | null,
      count?: number,
    ): Promise<StoreKey<DBTypes, StoreName>[]>;
  }

  type IDBPIndexExtends = Omit<
    IDBIndex,
    | "objectStore"
    | "count"
    | "get"
    | "getAll"
    | "getAllKeys"
    | "getKey"
    | "openCursor"
    | "openKeyCursor"
  >;

  export interface IDBPIndex<
    DBTypes extends DBSchema | unknown = unknown,
    TxStores extends ArrayLike<StoreNames<DBTypes>> = ArrayLike<
      StoreNames<DBTypes>
    >,
    StoreName extends StoreNames<DBTypes> = StoreNames<DBTypes>,
    IndexName extends IndexNames<DBTypes, StoreName> = IndexNames<
      DBTypes,
      StoreName
    >,
    Mode extends IDBTransactionMode = "readonly",
  > extends IDBPIndexExtends {
    /**
     * Retrieves all values that match the query.
     * Supported in chrome/edge 141 or newer.
     *
     * @param options
     */
    getAll(
      options?: IDBPIndexGetAllOptions<DBTypes, StoreName, IndexName>,
    ): Promise<StoreValue<DBTypes, StoreName>[]>;
    /**
     * Retrieves all values that match the query.
     *
     * @param query
     * @param count Maximum number of values to return.
     */
    getAll(
      query?: IndexKey<DBTypes, StoreName, IndexName> | IDBKeyRange | null,
      count?: number,
    ): Promise<StoreValue<DBTypes, StoreName>[]>;
    /**
     * Retrieves the keys of records matching the query.
     * Supported in chrome/edge 141 or newer.
     *
     * @param options
     */
    getAllKeys(
      options?: IDBPIndexGetAllOptions<DBTypes, StoreName, IndexName>,
    ): Promise<StoreKey<DBTypes, StoreName>[]>;
    /**
     * Retrieves the keys of records matching the query.
     *
     * @param query
     * @param count Maximum number of keys to return.
     */
    getAllKeys(
      query?: IndexKey<DBTypes, StoreName, IndexName> | IDBKeyRange | null,
      count?: number,
    ): Promise<StoreKey<DBTypes, StoreName>[]>;
  }
}
