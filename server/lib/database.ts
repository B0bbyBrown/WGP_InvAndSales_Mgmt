import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../../shared/schema.js';
import path from 'path';

// Create SQLite database file in the project root
const dbPath = path.join(process.cwd(), 'pizza-truck.db');

// Create the SQLite database connection
const sqlite = new Database(dbPath);

// Enable foreign keys for SQLite (important for referential integrity)
sqlite.pragma('foreign_keys = ON');

// Create the database connection
export const db = drizzle(sqlite, { schema });