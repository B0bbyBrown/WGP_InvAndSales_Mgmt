import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

// Create SQLite database file in the project root
const dbPath = path.join(process.cwd(), "pizza-truck.db");

console.log(`🗄️ Initializing SQLite database at: ${dbPath}`);

// Create the SQLite database connection
export const sqlite = new Database(dbPath);

// Enable foreign keys for SQLite (important for referential integrity)
sqlite.pragma("foreign_keys = ON");

// Only drop tables if RESET_DB environment variable is set
if (process.env.RESET_DB === "true") {
  try {
    console.log("🗑️ Resetting database...");
    sqlite.exec(`
      DROP TABLE IF EXISTS session_inventory_snapshots;
      DROP TABLE IF EXISTS sale_items;
      DROP TABLE IF EXISTS sales;
      DROP TABLE IF EXISTS cash_sessions;
      DROP TABLE IF EXISTS stock_movements;
      DROP TABLE IF EXISTS recipe_items;
      DROP TABLE IF EXISTS purchase_items;
      DROP TABLE IF EXISTS purchases;
      DROP TABLE IF EXISTS inventory_lots;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS ingredients;
      DROP TABLE IF EXISTS suppliers;
      DROP TABLE IF EXISTS expenses;
      DROP TABLE IF EXISTS users;
    `);
    console.log("✅ Dropped all existing tables");
  } catch (error) {
    console.error("❌ Failed to drop tables:", error);
    throw error;
  }
}

// Create the Drizzle database instance
export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist (SQLite will ignore if tables already exist)
try {
  // Create all tables using raw SQL since we can't use migrations
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'CASHIER' NOT NULL CHECK(role IN ('ADMIN', 'CASHIER', 'KITCHEN')),
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT UNIQUE NOT NULL,
      unit TEXT NOT NULL,
      low_stock_level REAL,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT UNIQUE NOT NULL,
      phone TEXT,
      email TEXT,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT UNIQUE NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      active INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      supplier_id TEXT REFERENCES suppliers(id),
      notes TEXT,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      purchase_id TEXT NOT NULL REFERENCES purchases(id),
      ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
      quantity REAL NOT NULL,
      total_cost REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_lots (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      purchased_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      product_id TEXT NOT NULL REFERENCES products(id),
      ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
      quantity REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cash_sessions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      opened_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      opened_by TEXT NOT NULL REFERENCES users(id),
      closed_at INTEGER,
      closed_by TEXT REFERENCES users(id),
      opening_float REAL DEFAULT 0 NOT NULL,
      closing_float REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      session_id TEXT REFERENCES cash_sessions(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      total REAL NOT NULL,
      cogs REAL NOT NULL,
      payment_type TEXT NOT NULL CHECK(payment_type IN ('CASH', 'CARD', 'OTHER')),
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      sale_id TEXT NOT NULL REFERENCES sales(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      qty INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      line_total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      kind TEXT NOT NULL CHECK(kind IN ('PURCHASE', 'SALE_CONSUME', 'ADJUSTMENT', 'WASTAGE', 'SESSION_OUT', 'SESSION_IN')),
      ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
      quantity REAL NOT NULL,
      reference TEXT,
      note TEXT,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      label TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_via TEXT NOT NULL CHECK(paid_via IN ('CASH', 'CARD', 'OTHER')),
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_inventory_snapshots (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      session_id TEXT NOT NULL REFERENCES cash_sessions(id),
      ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
      quantity REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('OPENING', 'CLOSING')),
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );
  `);

  console.log("✅ SQLite database tables created successfully");
} catch (error) {
  console.error("❌ Failed to create database tables:", error);
  throw error;
}

console.log(`✅ SQLite database ready at: ${dbPath}`);
