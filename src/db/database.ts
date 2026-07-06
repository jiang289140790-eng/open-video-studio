import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export type SqliteDatabase = DatabaseSync;

export function openDatabase(path = ":memory:"): SqliteDatabase {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export function migrate(db: SqliteDatabase): void {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const compiledSchemaPath = join(currentDir, "schema.sql");
  const sourceSchemaPath = join(process.cwd(), "src", "db", "schema.sql");
  const schemaPath = existsSync(compiledSchemaPath) ? compiledSchemaPath : sourceSchemaPath;
  db.exec(readFileSync(schemaPath, "utf8"));
}

export function createMigratedDatabase(path = ":memory:"): SqliteDatabase {
  const db = openDatabase(path);
  migrate(db);
  return db;
}
