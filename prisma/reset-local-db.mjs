import { readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const dir = dirname(fileURLToPath(import.meta.url));
const dbPath = join(dir, "dev.db");
const sqlPath = join(dir, "init.sql");

rmSync(dbPath, { force: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");
db.exec(readFileSync(sqlPath, "utf8"));
db.close();

console.log(`Created SQLite database at ${dbPath}`);
