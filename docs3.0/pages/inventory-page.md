# Inventory Page (`/inventory`) Data Flow Analysis

This document breaks down how the UI components on the inventory page connect to the backend data endpoints.

---

### 1. Displaying "Current Stock Levels"

- **UI Component**: The main table in `client/src/pages/inventory.tsx`.
- **Frontend API Call**: Uses the `useQuery` hook to call `getCurrentStock()` from `@/lib/api`.
- **API Wrapper (`@/lib/api.ts`)**: This function makes a `GET` request to the `/api/stock/current` endpoint.
- **Backend Route (`server/routes.ts`)**: The Express server handles this request and calls the `storage.getCurrentStock()` method.
- **Backend Logic (`server/sqlite-storage.ts`)**: Performs a `LEFT JOIN` on the `ingredients` and `inventoryLots` tables. This ensures all ingredients are returned, with a quantity of `0` if they have no stock yet.
- **Conclusion**: **Connected and working correctly.**

---

### 2. Creating a New Ingredient

- **UI Component**: The "Add Ingredient" button and its dialog in `client/src/pages/inventory.tsx`.
- **Frontend API Call**: On submission, it calls the `createIngredient` mutation.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `POST` request with the new ingredient's data to `/api/ingredients`.
- **Backend Route (`server/routes.ts`)**: The server validates the incoming data using a Zod schema and passes it to the `storage.createIngredient()` method.
- **Backend Logic (`server/sqlite-storage.ts`)**: A new row is inserted into the `ingredients` table.
- **Conclusion**: **Connected and working correctly.**

---

### 3. Adjusting Stock

- **UI Component**: The "Adjust Stock" button and dialog, and the `+` / `-` buttons on each ingredient row.
- **Frontend API Call**: Triggers the `adjustStock` mutation.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `POST` request to `/api/stock/adjust`.
- **Backend Route (`server/routes.ts`)**: Validates the request and calls the `storage.adjustStock()` method.
- **Backend Logic (`server/sqlite-storage.ts`)**: This is a transactional operation that:
  1.  Creates or consumes from `inventoryLots` using FIFO (First-In-First-Out) logic.
  2.  Records an `ADJUSTMENT` or `WASTAGE` movement in the `stockMovements` table.
- **Conclusion**: **Connected and working correctly.**

---

### 4. Displaying Low Stock Alert

- **UI Component**: The alert card that appears at the top of the page.
- **Frontend API Call**: Uses `useQuery` to call `getLowStock()`.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to `/api/stock/low`.
- **Backend Route (`server/routes.ts`)**: The server calls `storage.getLowStockIngredients()`.
- **Backend Logic (`server/sqlite-storage.ts`)**: Returns ingredients where the current stock is below the configured `lowStockLevel`.
- **Conclusion**: **Connected and working correctly.**

---

### 5. Displaying Recent Stock Movements

- **UI Component**: The table at the bottom of the page listing recent inventory changes.
- **Frontend API Call**: Uses `useQuery` to call `getStockMovements()`.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to `/api/stock/movements`.
- **Backend Route (`server/routes.ts`)**: Calls `storage.getStockMovements()`.
- **Backend Logic (`server/sqlite-storage.ts`)**: Fetches the most recent records from the `stock_movements` table, joining with `ingredients` to get the ingredient name.
- **Conclusion**: **Connected and working correctly.**
