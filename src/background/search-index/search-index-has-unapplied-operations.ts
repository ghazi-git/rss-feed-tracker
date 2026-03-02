import { getDBConnection } from "@/db-setup";

export async function hasUnappliedOperations() {
  using conn = await getDBConnection();
  const keys = await conn.db.getAllKeys("searchIndexOperations", { count: 1 });
  return keys.length > 0;
}
