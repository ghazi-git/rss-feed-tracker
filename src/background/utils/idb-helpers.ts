import { unwrap } from "idb";

import {
  ExtensionDB,
  ExtStoreName,
  ExtStoreValue,
  PrimaryKey,
} from "@/background/db-setup";
import { getChunks } from "@/background/utils/chunks";
import { TransactionError } from "@/background/utils/errors";

/**
 * Bulk add objects in chunks. Each chunk runs in a transaction.
 * @returns results of the addition for each object (success or not). If the
 * addition fails, it returns the error name.
 * Tolerating failures of inserting some items is helpful, for example, when
 * we want to ignore the ConstraintErrors due to adding duplicate posts.
 * @raises TransactionError when unable to save data. Usually means there an
 * error unrelated to the extension (I/O error or disk space issue)
 */
export async function bulkAdd<Name extends ExtStoreName>(
  db: ExtensionDB,
  storeName: Name,
  objs: ExtStoreValue<Name>[],
  chunkSize = 50,
) {
  const chunks = getChunks(objs, chunkSize);
  let results: RequestResult<ExtStoreValue<Name>>[] = [];
  for (const chunk of chunks) {
    const result = await addChunk(db, storeName, chunk);
    results = results.concat(result);
  }
  return results;
}

async function addChunk<Name extends ExtStoreName>(
  db: ExtensionDB,
  storeName: Name,
  objs: ExtStoreValue<Name>[],
) {
  const tx = unwrap(db.transaction(storeName, "readwrite"));
  const store = tx.objectStore(storeName);

  const addPromises = objs.map((obj) => {
    return new Promise<RequestResult<ExtStoreValue<Name>>>((resolve) => {
      const addRequest = store.add(obj);
      addRequest.onsuccess = () =>
        resolve({ success: true, item: obj, errorName: null });
      addRequest.onerror = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const error = addRequest.error as DOMException;
        resolve({ success: false, item: obj, errorName: error.name });
      };
    });
  });
  const results = await Promise.all(addPromises);

  await bulkAddRequestDone(tx);

  return results;
}

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
  let oldObject: ExtStoreValue<Name>;
  const updatedObj = await new Promise<ExtStoreValue<Name>>((resolve) => {
    const getRequest = store.get(pk);
    getRequest.onsuccess = () => {
      oldObject = getRequest.result as ExtStoreValue<Name>;
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
  });

  await txDone(tx);

  // @ts-expect-error oldObject is set when the get request succeeds
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

/**
 * Encapsulate a user-facing error message when the transaction is likely
 * aborted due to a disk or I/O problem, rather than to an issue specific
 * to the extension.
 * @raises TransactionError
 */
async function bulkAddRequestDone(tx: IDBTransaction) {
  try {
    await txDone(tx);
  } catch (e) {
    // all failures at the add request level do not bubble. So, this is likely
    // an IO error or disk space issue
    // https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction#transaction_failures
    console.error(
      "transaction-commit: failure to commit transaction with bulk requests",
      e,
    );
    const msg = "An unexpected error occurred. It might be a disk space issue.";
    throw new TransactionError(msg, { cause: e });
  }
}

export type RequestResult<T> =
  | { success: true; item: T; errorName: null }
  | { success: false; item: T; errorName: string };

type StoreUpdateFn<Name extends ExtStoreName> = (
  old: ExtStoreValue<Name>,
) => ExtStoreValue<Name>;
type StoreUpdateReturn<Name extends ExtStoreName> = [
  ExtStoreValue<Name>,
  ExtStoreValue<Name>,
];
