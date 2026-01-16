import { ExtensionDB } from "@/db-setup";

export async function acquireLock(db: ExtensionDB, lockId: string) {
  const createdAt = Date.now();
  try {
    // rely on .add() failing with a ConstraintError if the lock is already in use
    await db.add("locks", { id: lockId, createdAt });
  } catch {
    // lock in use
    // If it has been more than 15 minutes since lock creation, then force
    // release the lock in preparation for the next run.
    const lock = await db.get("locks", lockId);
    if (lock && lock.createdAt + 15 * 60 * 1000 < Date.now()) {
      await db.delete("locks", lockId);
      const now = new Date().toISOString();
      console.log(
        `[${now}] lock=${lockId} released forcibly so it can be used in the next run`,
      );
    }

    // dummy lock
    return {
      id: null,
      createdAt: null,
      async [Symbol.asyncDispose]() {
        await this.release();
      },
      release() {
        return Promise.resolve();
      },
    };
  }

  return {
    id: lockId,
    createdAt,
    async [Symbol.asyncDispose]() {
      await this.release();
    },
    async release() {
      await db.delete("locks", lockId);
    },
  };
}
