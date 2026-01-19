import { ExtensionDB } from "@/db-setup";

/**
 * acquires a lock by creating a new entry in the locks store in indexedDB
 * @raises ConstraintError to indicate that the lock is already in use
 */
export async function acquireLock(db: ExtensionDB, lockId: string) {
  const createdAt = Date.now();
  // rely on .add() failing with a ConstraintError if the lock is already in use
  await db.add("locks", { id: lockId, createdAt });

  return {
    id: lockId,
    createdAt,
    async [Symbol.asyncDispose]() {
      await releaseLock(db, lockId);
    },
  };
}

export async function releaseLock(db: ExtensionDB, lockId: string) {
  await db.delete("locks", lockId);
}

export async function hasLockExpired(db: ExtensionDB, lockId: string) {
  // If it has been more than 15 minutes since lock creation, then consider
  // the lock as "expired" allowing for force-releasing it
  const lock = await db.get("locks", lockId);
  return lock && lock.createdAt + 15 * 60 * 1000 < Date.now();
}
