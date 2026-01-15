import {
  IDBPIndexGetAllOptions,
  IDBPStoreGetAllOptions,
  StoreKey,
  StoreValue,
  unwrap,
} from "idb";

import {
  ExtensionDB,
  ExtIndexName,
  ExtStoreName,
  ExtStoreValue,
  FeedTrackerDB,
  PrimaryKey,
  ReadTX,
  ReadWriteTX,
} from "@/background/db-setup";
import { NotFoundError } from "@/background/utils/errors";

/**
 * Basically, a get and then a put executed in the same transaction.
 * @returns the updated object after applying the updates and the old object.
 * @raises DOMException that happens during the get or the put
 */
export async function update<Name extends ExtStoreName>(
  db: ExtensionDB,
  storeName: Name,
  pk: PrimaryKey<Name>,
  updateFn: StoreUpdateFn<Name>,
): Promise<StoreUpdateReturn<Name>>;
export async function update<Name extends ExtStoreName>(
  db: ExtensionDB,
  storeName: Name,
  pk: PrimaryKey<Name>,
  updates: Partial<ExtStoreValue<Name>>,
): Promise<StoreUpdateReturn<Name>>;
export async function update<Name extends ExtStoreName>(
  db: ExtensionDB,
  storeName: Name,
  pk: PrimaryKey<Name>,
  updatesOrUpdateFn: Partial<ExtStoreValue<Name>> | StoreUpdateFn<Name>,
): Promise<StoreUpdateReturn<Name>> {
  const tx = unwrap(db.transaction(storeName, "readwrite"));
  const store = tx.objectStore(storeName);
  let oldObject: ExtStoreValue<Name> | undefined;
  const updatedObj = await new Promise<ExtStoreValue<Name>>(
    (resolve, reject) => {
      const getRequest = store.get(pk);
      getRequest.onsuccess = () => {
        oldObject = getRequest.result as ExtStoreValue<Name> | undefined;
        if (!oldObject) {
          const msg = `Object to be updated not found storeName=${storeName} pk=${pk}`;
          reject(new NotFoundError(msg));
          return;
        }
        let updated: ExtStoreValue<Name>;
        if (typeof updatesOrUpdateFn === "function") {
          updated = updatesOrUpdateFn(structuredClone(oldObject));
        } else {
          updated = { ...oldObject, ...updatesOrUpdateFn };
        }
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          resolve(updated);
        };
      };
    },
  );

  await txDone(tx);

  return [updatedObj, oldObject] as [ExtStoreValue<Name>, ExtStoreValue<Name>];
}

/**
 * Replaces `tx.done` given the issue in https://github.com/jakearchibald/idb/issues/326
 * @raises the DOMException triggered by the transaction aborting. Listening to
 * "abort" only since the transaction is automatically aborted on error.
 */
export function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => {
      const error =
        tx.error ?? new DOMException("Request aborted.", "AbortError");
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

type StoreUpdateFn<Name extends ExtStoreName> = (
  old: ExtStoreValue<Name>,
) => ExtStoreValue<Name>;
type StoreUpdateReturn<Name extends ExtStoreName> = [
  ExtStoreValue<Name>,
  ExtStoreValue<Name>,
];
