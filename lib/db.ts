import "server-only";
import { createClient, type Client, type InArgs } from "@libsql/client";
import { config } from "./config";

const g = globalThis as unknown as { __vgDb?: Client };

/** The Turso (libSQL) connection, shared across requests. */
export function getDb(): Client {
  if (!g.__vgDb) {
    g.__vgDb = createClient({ url: config.tursoUrl, authToken: config.tursoAuthToken });
  }
  return g.__vgDb;
}

/** All rows from a query, typed as T. */
export async function all<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const r = await getDb().execute({ sql, args });
  return r.rows as unknown as T[];
}

/** The first row of a query, or undefined. */
export async function get<T>(sql: string, args: InArgs = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0];
}

/** An INSERT/UPDATE statement. */
export async function run(sql: string, args: InArgs = []): Promise<void> {
  await getDb().execute({ sql, args });
}

export async function tableExists(name: string): Promise<boolean> {
  return !!(await get("SELECT 1 FROM sqlite_master WHERE type IN ('table','view') AND name = ?", [name]));
}
