import { unwrap } from "idb";

import {
  ExtensionDB,
  ExtStoreName,
  ExtStoreValue,
  ExtTransaction,
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
  const tx = db.transaction(storeName, "readwrite");
  const store = unwrap(tx.store);

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

  await bulkRequestDone(tx);

  return results;
}

/**
 * Basically, a get and then a put executed in the same transaction.
 * @returns the object after applying the updates.
 * @raises DOMException that happens during the get or the put
 */
export async function update<Name extends ExtStoreName>(
  db: ExtensionDB,
  storeName: Name,
  pk: PrimaryKey<Name>,
  updates: Partial<ExtStoreValue<Name>>,
) {
  const tx = db.transaction(storeName, "readwrite");
  const store = unwrap(tx.store);
  const updatedObj = await new Promise<ExtStoreValue<Name>>(
    (resolve, reject) => {
      const getRequest = store.get(pk);
      getRequest.onsuccess = () => {
        const obj = getRequest.result as ExtStoreValue<Name>;
        const updated = { ...obj, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => {
          resolve(updated);
        };
        putRequest.onerror = () => {
          reject(putRequest.error);
        };
      };
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    },
  );

  await txDone(tx);

  return updatedObj;
}

/**
 * Replace `tx.done` with the fix from https://github.com/jakearchibald/idb/pull/338
 * @raises the DOMException triggered by the transaction erroring or aborting
 */
export function txDone(tx: ExtTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = (event) => {
      reject(tx.error ?? (event.target as unknown as IDBRequest).error);
    };
    tx.onabort = () => {
      reject(new DOMException("Request aborted.", "AbortError"));
    };
  });
}

/**
 * Encapsulate a user-facing error message when the transaction is likely
 * aborted due to a disk or I/O problem, rather than to an issue specific
 * to the extension.
 * To be used for awaiting transactions with multiple requests, where request
 * failures do not bubble to the transaction level as done in `bulkAdd`.
 * @raises TransactionError
 */
async function bulkRequestDone(tx: ExtTransaction) {
  try {
    await txDone(tx);
  } catch (e) {
    // all failures at the add request level do not bubble. So, this is likely
    // an IO error or disk space issue
    // https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction#transaction_failures
    console.error(e);
    const msg = "An unexpected error occurred. It might be a disk space issue.";
    throw new TransactionError(msg, { cause: e });
  }
}

export type RequestResult<T> =
  | { success: true; item: T; errorName: null }
  | { success: false; item: T; errorName: string };
