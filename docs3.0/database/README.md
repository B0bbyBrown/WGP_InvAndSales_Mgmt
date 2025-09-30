# Database Documentation

## Overview

The Wheely Good Pizza Tracker uses SQLite for data storage. This choice provides:

- Zero-configuration setup
- Single file storage
- No external dependencies
- Perfect for single-location deployments

## Database File

The database is stored in `pizza-truck.db` in the project root. This file:

- Is created automatically on first run
- Contains all tables and data
- Can be backed up by simply copying the file
- Can be deleted to start fresh

## Schema

### Core Tables

#### users

- Stores admin and cashier accounts
- Only admin user is seeded automatically

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'CASHIER' NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### ingredients

- Stores ingredient definitions
- Links to inventory tracking

```sql
CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL,
  low_stock_level REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### products

- Stores product definitions
- Links to recipes

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price REAL NOT NULL,
  active INTEGER DEFAULT 1 NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Inventory Management

#### inventory_lots

- Tracks ingredient stock using FIFO
- Created by purchases
- Consumed by sales

```sql
CREATE TABLE inventory_lots (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL NOT NULL,
  purchased_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### stock_movements

- Audit trail for inventory changes

```sql
CREATE TABLE stock_movements (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  reference TEXT,
  note TEXT,
  created_at INTEGER NOT NULL
);
```

### Sales & Sessions

#### cash_sessions

- Tracks business operating sessions
- Links sales to sessions

```sql
CREATE TABLE cash_sessions (
  id TEXT PRIMARY KEY,
  opened_at INTEGER NOT NULL,
  opened_by TEXT NOT NULL,
  closed_at INTEGER,
  closed_by TEXT,
  opening_float REAL DEFAULT 0 NOT NULL,
  closing_float REAL,
  notes TEXT
);
```

#### session_inventory_snapshots

- Records inventory levels at session start/end

```sql
CREATE TABLE session_inventory_snapshots (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

#### sales

- Records sales transactions

```sql
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  user_id TEXT NOT NULL,
  total REAL NOT NULL,
  cogs REAL NOT NULL,
  payment_type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

### Supporting Tables

#### suppliers

```sql
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### purchases

```sql
CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  supplier_id TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);
```

#### recipe_items

```sql
CREATE TABLE recipe_items (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  quantity REAL NOT NULL
);
```

#### expenses

```sql
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  amount REAL NOT NULL,
  paid_via TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

## Data Flow

1. **Inventory Management**:

   - Purchases create inventory lots
   - Sales consume lots using FIFO
   - Stock movements track all changes

2. **Sales Process**:

   - Cash session must be open
   - Sale records created
   - Inventory consumed
   - COGS calculated using FIFO

3. **Session Management**:
   - Opening records cash float and inventory
   - Sales linked to session
   - Closing records final cash and inventory
   - Variance calculated automatically

## Utilities

### Reset Database

To start fresh:

1. Stop the server
2. Delete `pizza-truck.db`
3. Run `npm run dev:reset`

### Backup Database

Simply copy `pizza-truck.db` to another location.

## Development Notes

- All timestamps are stored as Unix timestamps (seconds since epoch)
- All IDs are UUIDs
- Foreign keys are enforced
- Decimal values use REAL type for better precision
- Enums are enforced via CHECK constraints
