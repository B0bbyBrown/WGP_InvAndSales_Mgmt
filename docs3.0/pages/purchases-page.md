# Purchases Page

## Overview

- Create and view purchase orders to stock inventory.
- Integrates with suppliers and ingredients.

## Key Features

- Create new purchase: Select supplier, add items (ingredient, quantity, cost).
- **New**: Add new suppliers or ingredients on-the-fly from the dropdowns (select 'Add New' to open creation dialog).
- View history of purchases.

---

### 1. Displaying Past Purchases

- **UI Component**: The main table in `client/src/pages/purchases.tsx` that lists all historical purchase orders.
- **Frontend API Call**: Uses a `useQuery` hook to call `getPurchases()` from `@/lib/api`.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to the `/api/purchases` endpoint.
- **Backend Route (`server/routes.ts`)**: The server calls the `storage.getPurchases()` method.
- **Backend Logic (`server/sqlite-storage.ts`)**: Performs a `SELECT` query to retrieve all records from the `purchases` table, ordered by the most recent.
- **Conclusion**: **Connected and working correctly.**

---

### 2. Creating a New Purchase (Replenishing Stock)

This is the core workflow for adding inventory into the system.

- **UI Component**: The "Record Purchase" button and its dialog. The form allows a user to select a supplier and add multiple line items, each specifying an ingredient, its quantity, and its total cost.
- **Frontend API Call**: On submission, it constructs a payload containing the `supplierId` and an array of `items`. This is sent to the `createPurchase` mutation.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `POST` request to `/api/purchases` with the purchase data.
- **Backend Route (`server/routes.ts`)**: The server validates the request and calls the `storage.createPurchase()` method.
- **Backend Logic (`server/sqlite-storage.ts`)**: The `createPurchase` method is an atomic database transaction that handles all aspects of adding new stock:
  1.  **Creates Purchase Record**: Inserts a new row into the `purchases` table.
  2.  **Creates Purchase Items**: For each ingredient in the purchase, it inserts a corresponding row into the `purchase_items` table.
  3.  **Creates Inventory Lots**: This is the most critical step. For each item, it calculates the `unitCost` and creates a **new, separate row** in the `inventoryLots` table. This is the foundation of the FIFO (First-In, First-Out) system, as each purchase is tracked as a distinct batch with its own cost.
  4.  **Creates Stock Movements**: It creates a `PURCHASE` record in the `stock_movements` table for each item to provide a clear, chronological log of the inventory increase.
- **Conclusion**: **Connected and working correctly.** The process is transactional and robust, ensuring that new inventory is added correctly and all historical records are created simultaneously.
