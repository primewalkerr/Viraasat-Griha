import "server-only";
import Database from "better-sqlite3";
import { config } from "./config";

type DB = Database.Database;

const g = globalThis as unknown as { __vgRead?: DB; __vgWrite?: DB };

/** Read-only connection to the admin's viraasat.db (kept across hot reloads). */
export function readDb(): DB {
  if (!g.__vgRead) {
    g.__vgRead = new Database(config.dbPath, { readonly: true, fileMustExist: true });
    g.__vgRead.pragma("busy_timeout = 3000");
  }
  return g.__vgRead;
}

/** Read-write connection, used only for the contact form. */
export function writeDb(): DB {
  if (!g.__vgWrite) {
    g.__vgWrite = new Database(config.dbPath, { fileMustExist: true });
    g.__vgWrite.pragma("busy_timeout = 3000");
    g.__vgWrite.pragma("foreign_keys = ON");
  }
  return g.__vgWrite;
}

export function tableExists(db: DB, name: string): boolean {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type IN ('table','view') AND name = ?").get(name);
}
