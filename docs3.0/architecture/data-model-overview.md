# Data Model Overview

This document explains the core data entities in the Wheely Good Pizza application and how they interact with each other. Understanding these relationships is key to understanding the application's logic.

---

### Core Data Entities

There are several primary entities that drive the application's logic.

#### 1. Users

- **Purpose**: Represents individuals who can log in and interact with the system.
- **Key Attributes**:
  - `Name`
  - `Email`
  - `Role`: (e.g., `ADMIN`, `CASHIER`, `KITCHEN`)

#### 2. Ingredients

- **What they are**: The raw materials you use to make your products or sell directly.
- **Examples**: `Flour`, `Tomato Sauce`, `Mozzarella Cheese`, `Coca-Cola Can`.
- **Key Attributes**:
  - `Name`: (e.g., "Flour")
  - `Unit`: The unit of measurement (e.g., `g`, `kg`, `ml`, `l`, `unit`).
  - `Low Stock Level`: A threshold to trigger low stock warnings.
- **Purpose**: They are the fundamental building blocks of your inventory.

#### 3. Products

- **What they are**: The finished goods that you sell to customers.
- **Examples**: `Margherita Pizza`, `Pepperoni Pizza`, `Can of Coke`.
- **Key Attributes**:
  - `Name`: The customer-facing name.
  - `SKU`: A unique internal identifier.
  - `Price`: How much the customer pays.
- **Purpose**: Represents what is available on your menu for sale. A product's recipe is defined in the `Recipe Items` table.

#### 4. Suppliers

- **Purpose**: Stores information about the vendors from whom you purchase ingredients.
- **Key Attributes**:
  - `Name`
  - `Contact Info`: (phone, email)

#### 5. Purchases

- **Purpose**: Records a transaction where you buy ingredients from a supplier. Each purchase contains multiple `Purchase Items`.

#### 6. Sales

- **Purpose**: Records a transaction where a customer buys products. Each sale is linked to a `Cash Session` and contains multiple `Sale Items`.

#### 7. Cash Sessions

- **What they are**: A record of a single period of business activity, like a lunch shift or a full day at a specific location.
- **Key Attributes**:
  - `Opening Float`: The starting cash amount in the register.
  - `Closing Float`: The ending cash amount.
- **Purpose**: To isolate and track sales, cash flow, and stock consumption for a specific operational period. Inventory for the session is tracked via `Session Inventory Snapshots`.

#### 8. Expenses

- **Purpose**: Tracks miscellaneous business expenses that are not direct purchases of ingredients.
- **Key Attributes**:
  - `Label`: A description of the expense.
  - `Amount`
  - `Paid Via`: (e.g., `CASH`, `CARD`)

---

### Linking and Logging Tables

These tables connect the core entities and provide a detailed audit trail of all activities.

- **`Recipe Items`**: Links **Ingredients** to **Products** to define a recipe. It specifies the quantity of each ingredient needed for one unit of a product.

- **`Sale Items`**: A line item in a **Sale**, linking a **Product** to the sale record with the quantity sold and price.

- **`Purchase Items`**: A line item in a **Purchase**, linking an **Ingredient** to the purchase record with the quantity and cost.

- **`Inventory Lots`**: Represents a specific batch of an **Ingredient** that was purchased. It tracks the quantity on hand and the unit cost for that batch, which is crucial for FIFO (First-In, First-Out) costing. This is the table that represents your physical stock.

- **`Stock Movements`**: A comprehensive log of every single change to the inventory. Every time an ingredient's quantity changes (due to a sale, purchase, wastage, etc.), a record is created here. This provides a full audit trail.

- **`Session Inventory Snapshots`**: Records the quantity of each **Ingredient** at the beginning and end of a **Cash Session**. This is used to track consumption and manage on-site vs. main stock levels.

---

### How They Interact: Key Workflows

#### Workflow 1: Making a Sale

This is the central workflow that connects everything.

1.  A **Product** is sold (e.g., a `Margherita Pizza`) within an active **Cash Session**.
2.  The system looks up the **Product's** `Recipe`.
3.  The `Recipe` specifies which **Ingredients** are needed (e.g., 150g of `Tomato Sauce`, 200g of `Mozzarella Cheese`).
4.  The system reduces the quantity of those **Ingredients** from your main **Stock** (Inventory Lots) using a FIFO (First-In, First-Out) method.
5.  A `SALE_CONSUME` record is created in the `stock_movements` table to log this change.

**In short**: Selling a **Product** consumes the **Ingredients** from your **Stock** as defined by its `Recipe`.

#### Workflow 2: Managing On-Site vs. Main Stock

1.  At the start of the day, you have your main **Stock** (e.g., 20kg of `Flour` at your base kitchen).
2.  You open a **Cash Session** and specify you are taking 5kg of `Flour` to the food truck.
3.  The system creates a `SESSION_OUT` stock movement. Your main **Stock** of `Flour` is now 15kg.
4.  Throughout the session, sales consume flour from the 5kg you took. Let's say you use 4kg.
5.  At the end of the day, you close the **Cash Session** and record that you have 1kg of `Flour` remaining.
6.  The system creates a `SESSION_IN` stock movement. Your main **Stock** of `Flour` is now updated to 16kg (the 15kg you left behind + the 1kg you brought back).

This ensures your main inventory count is always accurate and reflects what is physically available in your primary storage.
