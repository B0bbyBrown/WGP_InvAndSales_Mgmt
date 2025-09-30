# Sales Page (`/sales`) Data Flow Analysis

This document details the data flow for the Sales page, which is the primary interface for recording sales and triggering the automatic consumption of inventory.

---

### 1. Displaying Past Sales

- **UI Component**: The main table of historical sales records in `client/src/pages/sales.tsx`.
- **Frontend API Call**: Uses `useQuery` to call `getSales()`, which can be refetched with `from` and `to` date parameters from a date picker.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to `/api/sales`, appending the optional date range as query parameters.
- **Backend Route (`server/routes.ts`)**: The server parses the date range and calls `storage.getSales()`.
- **Backend Logic (`server/sqlite-storage.ts`)**: Performs a `SELECT` query on the `sales` table, filtering by `createdAt` if a date range is provided.
- **Conclusion**: **Connected and working correctly.**

---

### 2. Creating a New Sale (The Core Application Transaction)

This is the most complex and critical transaction in the entire application, as it ties together sales, financials, and inventory.

- **UI Component**: The "Record Sale" button and its dialog. The form allows a user to build a cart of products and specify quantities.
- **Frontend API Call**: On submission, it constructs a payload containing the `paymentType` and an array of `items` (each with a `productId` and `qty`). This is sent to the `createSale` mutation.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `POST` request to `/api/sales` with the sale payload.
- **Backend Route (`server/routes.ts`)**: The server validates the request and calls the `storage.createSale()` method, passing the sale data and the active user's ID.
- **Backend Logic (`server/sqlite-storage.ts`)**: The `createSale` method is a large, atomic database transaction that performs the following steps in order:
  1.  **Calculates Revenue**: Loops through sale items to calculate the total revenue.
  2.  **Fetches Recipes**: For each product sold, it retrieves its recipe from the `recipe_items` table.
  3.  **Calculates COGS & Consumes Stock**: It determines the required quantity of each ingredient, finds the oldest corresponding `inventoryLots` (FIFO), calculates the Cost of Goods Sold (COGS) from that lot's `unitCost`, and decrements the lot's quantity. **This is the point of automatic stock depletion.**
  4.  **Creates Records**: It inserts new rows into the `sales` table (with the final totals), the `sale_items` table (one for each product line), and the `stock_movements` table (a `SALE_CONSUME` movement for each consumed ingredient).
- **Conclusion**: **Connected and working correctly.** This is a well-designed, robust transaction that correctly handles all financial and inventory implications of a sale in a single, atomic operation.
