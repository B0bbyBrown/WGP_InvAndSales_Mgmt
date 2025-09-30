# Dashboard Page (`/dashboard`) Data Flow Analysis

This document analyzes the data flow for the key components on the dashboard page, tracing the connection from the UI to the backend database.

---

### 1. "Today's Overview" KPIs (Key Performance Indicators)

- **UI Component**: The four main stat cards at the top of the dashboard (Revenue, COGS, Gross Margin, and Orders).
- **Frontend API Call**: The component uses a `useQuery` hook to call `getOverview()` from `@/lib/api`. It also makes a separate call to `getSales()` for the previous day's date range to calculate the percentage change vs. yesterday for revenue and margin.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to the `/api/reports/overview` endpoint.
- **Backend Route (`server/routes.ts`)**: The server calls the `storage.getTodayKPIs()` method.
- **Backend Logic (`server/sqlite-storage.ts`)**: This method calculates the key metrics by filtering the `sales` table for records created "today", then summing the `total` and `cogs`, and counting the number of orders.
- **Conclusion**: **Connected and working correctly.**

---

### 2. "Top Selling Products" List

- **UI Component**: The list of top products displayed on the dashboard.
- **Frontend API Call**: Uses `useQuery` to call `getTopProducts()`.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to `/api/reports/top-products`, defaulting to a date range of "today".
- **Backend Route (`server/routes.ts`)**: The server sets the date range to "today" if no parameters are provided and calls the `storage.getTopProducts()` method.
- **Backend Logic (`server/sqlite-storage.ts`)**: This method joins the `saleItems`, `sales`, and `products` tables. It filters by the date range, groups by product, and orders the results by total revenue in descending order.
- **Conclusion**: **Connected and working correctly.**

---

### 3. "Recent Activity" Feed

- **UI Component**: The activity feed on the dashboard.
- **Frontend API Call**: Calls `getRecentActivity()`.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to `/api/reports/activity`.
- **Backend Route (`server/routes.ts`)**: Calls the `storage.getRecentActivity()` method, passing along a `limit` parameter.
- **Backend Logic (`server/sqlite-storage.ts`)**: This method fetches the latest sales and the latest expenses in two separate queries, combines them, sorts the unified list by date, and returns the most recent entries.
- **Conclusion**: **Connected and working correctly.**

---

### 4. "Low Stock Alert" Card

- **UI Component**: A card that lists ingredients that have fallen below their configured low stock threshold.
- **Frontend API Call**: Uses `useQuery` to call `getLowStock()`.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to `/api/stock/low`.
- **Backend Route (`server/routes.ts`)**: The server calls `storage.getLowStockIngredients()`.
- **Backend Logic (`server/sqlite-storage.ts`)**: This method aggregates the current quantity for each ingredient from the `inventory_lots` table and returns any where the total is less than the `lowStockLevel` defined in the `ingredients` table.
- **Conclusion**: **Connected and working correctly.**

---

### 5. "Sales Trend (Last 7 Days)" Chart

- **UI Component**: An area chart visualizing revenue over the past week.
- **Frontend API Call**: Calls `getSales()` with a date range from 7 days ago until today.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to `/api/sales` with `from` and `to` query parameters.
- **Backend Route (`server/routes.ts`)**: Fetches all sales within the given date range.
- **Frontend Logic**: The component processes the flat list of sales, grouping them by day to construct the data series needed for the chart.
- **Conclusion**: **Connected and working correctly.**
