# Feature Specification: Inventory Variance Tracking

## 1. Overview

This document outlines the technical specification for implementing inventory variance tracking, a feature designed to compare theoretical inventory usage against actual usage, providing critical insights into kitchen efficiency, waste, and profitability.

## 2. Rationale

The current system calculates inventory consumption based on recipe definitions (theoretical usage). This is accurate for accounting but doesn't capture real-world factors like over-portioning, spoilage, or waste.

By introducing a physical count at the beginning and end of each cash session, we can calculate the _actual_ usage and compare it to the theoretical usage. The difference between these two numbers is the **variance**. Tracking this variance is a key performance indicator for operational efficiency.

## 3. Database Schema Changes

A new table, `sessionInventorySnapshots`, will be created to store the physical inventory counts taken at the start and end of each cash session.

### `sessionInventorySnapshots` Table Definition

- **`id`** (TEXT, Primary Key): Unique identifier for the snapshot record.
- **`sessionId`** (TEXT, Foreign Key -> `cashSessions.id`): Links the snapshot to a specific cash session.
- **`ingredientId`** (TEXT, Foreign Key -> `ingredients.id`): The ingredient being measured.
- **`quantity`** (REAL): The measured quantity (e.g., weight, count) of the ingredient at the time of the snapshot.
- **`type`** (TEXT, ENUM: `'OPENING'`, `'CLOSING'`): Specifies whether this is a start-of-session or end-of-session count.
- **`createdAt`** (INTEGER, Timestamp): The timestamp when the snapshot was recorded.

## 4. Backend API Modifications

### `POST /api/sessions/open`

The request body for this endpoint will be expanded to accept an array of opening inventory counts.

- **Current Body**: `{ openingFloat: REAL, notes?: TEXT }`
- **New Body**:
  ```json
  {
    "openingFloat": "200.00",
    "notes": "Morning shift start",
    "inventory": [
      { "ingredientId": "uuid-for-cheese", "quantity": "10.5" },
      { "ingredientId": "uuid-for-dough", "quantity": "25.2" }
    ]
  }
  ```

### `POST /api/sessions/:id/close`

Similarly, the request body for closing a session will be updated to include closing inventory counts.

- **Current Body**: `{ closingFloat: REAL, notes?: TEXT }`
- **New Body**:
  ```json
  {
    "closingFloat": "150.00",
    "notes": "Evening shift end",
    "inventory": [
      { "ingredientId": "uuid-for-cheese", "quantity": "2.1" },
      { "ingredientId": "uuid-for-dough", "quantity": "5.7" }
    ]
  }
  ```

## 5. Frontend UI/UX Changes

### Open Session Page (`/sessions`)

- The UI for opening a new session will be updated to include a form for capturing the opening inventory snapshots.
- Below the "Opening Float" input, a list of all active ingredients will be displayed.
- Each ingredient in the list will have a corresponding number input field for the user to enter the starting quantity (e.g., weight).
- The "Open Session" button will submit both the float and the entire list of inventory snapshots to the backend.

### Close Session Page (`/sessions`)

- A similar UI will be implemented for closing a session.
- It will display a list of all active ingredients, each with an input field for the closing quantity.
- The "Close Session" button will submit the closing float and the closing inventory snapshots.

## 6. Reporting and Analysis (Future Scope)

Once this data is captured, a new "Variance Report" can be created. This report would be generated after a session is closed and would display:

- **Opening Stock**: From the 'OPENING' snapshot.
- **Purchases During Session**: (This would require timestamping purchases).
- **Closing Stock**: From the 'CLOSING' snapshot.
- **Actual Usage**: (Opening + Purchases) - Closing.
- **Theoretical Usage**: Calculated from sales during the session.
- **Variance**: Actual Usage - Theoretical Usage.
- **Variance %**: (Variance / Actual Usage) \* 100.
