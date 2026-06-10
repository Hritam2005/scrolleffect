import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
export async function setupDatabase() {
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  // Create table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      objective TEXT NOT NULL,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Database initialized successfully.");
  return db;
}
