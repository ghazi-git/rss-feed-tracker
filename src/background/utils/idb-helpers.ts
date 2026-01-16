import {
  IDBPIndexGetAllOptions,
  IDBPStoreGetAllOptions,
  StoreKey,
  StoreValue,
  unwrap,
} from "idb";

import {
  ExtIndexName,
  ExtStoreName,
  FeedTrackerDB,
  ReadTX,
  ReadWriteTX,
} from "@/db-setup";

/**
 * Replaces `tx.done` given the issue in https://github.com/jakearchibald/idb/issues/326
 * @raises the DOMException triggered by the transaction aborting. Listening to
 * "abort" only since the transaction is automatically aborted on error.
 */
export function txDone(tx: IDBTransaction | ReadWriteTX | ReadTX) {
  const trx = tx instanceof IDBTransaction ? tx : unwrap(tx);
  return new Promise<void>((resolve, reject) => {
    trx.oncomplete = () => resolve();
    trx.onabort = () => {
      const error =
        trx.error ?? new DOMException("Request aborted.", "AbortError");
      reject(error);
    };
  });
}

export async function getAllFromIndex<
  StoreName extends ExtStoreName,
  IndexName extends ExtIndexName<StoreName>,
>(
  tx: ReadTX | ReadWriteTX,
  storeName: StoreName,
  indexName: IndexName,
  options?: IDBPIndexGetAllOptions<FeedTrackerDB, StoreName, IndexName>,
) {
  const store = tx.objectStore(storeName);
  const index = store.index(indexName);
  return await index.getAll(options);
}

export async function getAll<Name extends ExtStoreName>(
  tx: ReadTX | ReadWriteTX,
  storeName: Name,
  options?: IDBPStoreGetAllOptions<FeedTrackerDB, Name>,
) {
  const store = tx.objectStore(storeName);
  return await store.getAll(options);
}

export async function getObject<Name extends ExtStoreName>(
  tx: ReadTX | ReadWriteTX,
  storeName: Name,
  key: StoreKey<FeedTrackerDB, Name> | IDBKeyRange,
) {
  const store = tx.objectStore(storeName);
  return await store.get(key);
}

export async function saveObject<Name extends ExtStoreName>(
  tx: ReadWriteTX,
  storeName: Name,
  obj: StoreValue<FeedTrackerDB, Name>,
) {
  const store = tx.objectStore(storeName);
  return await store.put(obj);
}
