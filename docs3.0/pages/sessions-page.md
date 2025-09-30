# Sessions Page (`/sessions`) Data Flow Analysis

This document outlines the data flow for the Sessions page, which manages the lifecycle of a business period (e.g., a day's shift), including cash management and the movement of on-site inventory.

---

### 1. Displaying Session Information

- **UI Component**: The main view in `client/src/pages/sessions.tsx`, which conditionally shows an "Active Session" card or a "No Active Session" view, along with a list of past sessions.
- **Frontend API Call**: The page uses `useQuery` to make two primary calls:
  1.  `getActiveCashSession()`: To check if a session is currently open.
  2.  `getCashSessions()`: To retrieve the list of all historical sessions.
- **API Wrappers (`@/lib/api.ts`)**:
  - `getActiveCashSession()` maps to `GET /api/sessions/active`.
  - `getCashSessions()` maps to `GET /api/sessions`.
- **Backend Routes (`server/routes.ts`)**: The routes call the corresponding storage methods.
- **Backend Logic (`server/sqlite-storage.ts`)**:
  - `getActiveCashSession()`: Selects a session `WHERE closedAt IS NULL`.
  - `getCashSessions()`: Selects all sessions, ordered by most recent.
- **Conclusion**: **Connected and working correctly.**

---

### 2. Opening a New Session (Transactional)

This is a critical, atomic operation that starts the business day.

- **UI Component**: The "Open Session" button and its dialog, which collects the opening cash float and the quantities of each ingredient being taken on-site.
- **Frontend API Call**: Submitting the form triggers the `openSessionMutation`.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `POST` request to `/api/sessions/open`.
- **Backend Route (`server/routes.ts`)**: The route now calls a single, unified method: `storage.openSessionAndMoveStock()`.
- **Backend Logic (`server/sqlite-storage.ts`)**: The `openSessionAndMoveStock()` method is an atomic database transaction that performs three steps in order:
  1.  **Creates Session Record**: Inserts a new row into the `cash_sessions` table.
  2.  **Updates Stock**: Calls an internal `updateStockForSession()` method. This checks for sufficient inventory, depletes the main stock from `inventoryLots`, and creates `SESSION_OUT` stock movements. If inventory is insufficient, the entire transaction is rolled back, preventing data inconsistency.
  3.  **Creates Snapshot**: Records the opening inventory quantities in the `session_inventory_snapshots` table for historical tracking.
- **Conclusion**: **Connected and working correctly.** The process is robust and guarantees data integrity.

---

### 3. Closing an Active Session

This workflow finalizes the business day and reconciles the on-site inventory.

- **UI Component**: The "Close Session" button and dialog, collecting the closing float and final on-site inventory counts.
- **Frontend API Call**: Submitting the form triggers the `closeSessionMutation`.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `POST` request to `/api/sessions/:id/close`.
- **Backend Route (`server/routes.ts`)**: The server calls the necessary storage methods in sequence.
- **Backend Logic (`server/sqlite-storage.ts`)**:
  1.  `closeCashSession()` is called to update the session record with the closing float and timestamp.
  2.  `updateStockForSession()` is called with the `CLOSING` type, which adds the remaining inventory back into the main `inventoryLots` and creates `SESSION_IN` stock movements.
  3.  `createInventorySnapshots()` is called to save the final counts for the historical record.
- **Conclusion**: **Connected and working correctly.** The process accurately returns remaining stock and finalizes the session.
