import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import {
  check,
  text,
  integer,
  real,
  sqliteTable,
} from "drizzle-orm/sqlite-core";
import { z } from "zod";
import crypto from "crypto";

// Users table
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["ADMIN", "CASHIER", "KITCHEN"] })
    .default("CASHIER")
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Unified Items table
export const items = sqliteTable("items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").unique().notNull(),
  sku: text("sku").unique(),
  type: text("type", {
    enum: ["RAW", "MANUFACTURED", "SELLABLE"],
  }).notNull(),
  unit: text("unit").notNull(),
  price: real("price"), // Only for SELLABLE items
  lowStockLevel: real("low_stock_level"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Suppliers table
export const suppliers = sqliteTable("suppliers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").unique().notNull(),
  phone: text("phone"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Recipe items (BOM)
export const recipeItems = sqliteTable("recipe_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentItemId: text("parent_item_id")
    .references(() => items.id)
    .notNull(),
  childItemId: text("child_item_id")
    .references(() => items.id)
    .notNull(),
  quantity: real("quantity").notNull(),
});

// Cash sessions table
export const cashSessions = sqliteTable("cash_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  openedAt: integer("opened_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  openedBy: text("opened_by")
    .references(() => users.id)
    .notNull(),
  closedAt: integer("closed_at", { mode: "timestamp" }),
  closedBy: text("closed_by").references(() => users.id),
  openingFloat: real("opening_float").default(0).notNull(),
  closingFloat: real("closing_float"),
  notes: text("notes"),
});

// Sales table
export const sales = sqliteTable("sales", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").references(() => cashSessions.id),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  total: real("total").notNull(),
  cogs: real("cogs").notNull(),
  paymentType: text("payment_type", {
    enum: ["CASH", "CARD", "OTHER"],
  }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Sale items table
export const saleItems = sqliteTable(
  "sale_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    saleId: text("sale_id")
      .references(() => sales.id)
      .notNull(),
    itemId: text("item_id")
      .references(() => items.id)
      .notNull(),
    qty: integer("qty").notNull(),
    unitPrice: real("unit_price").notNull(),
    lineTotal: real("line_total").notNull(),
    status: text("status").notNull().default("PENDING"),
  },
  (t) => ({
    statusCheck: check(
      "status_check",
      sql`${t.status} IN ('PENDING', 'RECEIVED', 'PREPPING', 'DONE')`
    ),
  })
);

// Purchases table
export const purchases = sqliteTable("purchases", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  supplierId: text("supplier_id").references(() => suppliers.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Purchase items table
export const purchaseItems = sqliteTable("purchase_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  purchaseId: text("purchase_id")
    .references(() => purchases.id)
    .notNull(),
  itemId: text("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: real("quantity").notNull(),
  totalCost: real("total_cost").notNull(),
});

// Inventory lots table
export const inventoryLots = sqliteTable("inventory_lots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: real("quantity").notNull(),
  unitCost: real("unit_cost").notNull(),
  purchasedAt: integer("purchased_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Stock movements table
export const stockMovements = sqliteTable("stock_movements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  kind: text("kind", {
    enum: [
      "PURCHASE",
      "SALE_CONSUME",
      "ADJUSTMENT",
      "WASTAGE",
      "SESSION_OUT",
      "SESSION_IN",
    ],
  }).notNull(),
  itemId: text("item_id")
    .references(() => items.id)
    .notNull(),
  quantity: real("quantity").notNull(),
  reference: text("reference"),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Expenses table
export const expenses = sqliteTable("expenses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  label: text("label").notNull(),
  amount: real("amount").notNull(),
  paidVia: text("paid_via", { enum: ["CASH", "CARD", "OTHER"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Session inventory snapshots table
export const sessionInventorySnapshots = sqliteTable(
  "session_inventory_snapshots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .references(() => cashSessions.id)
      .notNull(),
    itemId: text("item_id")
      .references(() => items.id)
      .notNull(),
    quantity: real("quantity").notNull(),
    type: text("type", { enum: ["OPENING", "CLOSING"] }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }
);

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({
  id: true,
});

export const insertInventoryLotSchema = createInsertSchema(inventoryLots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipeItemSchema = createInsertSchema(recipeItems).omit({
  id: true,
});

export const insertCashSessionSchema = createInsertSchema(cashSessions).omit({
  id: true,
  openedAt: true,
  closedAt: true,
  closedBy: true,
  closingFloat: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});

export const insertStockMovementSchema = createInsertSchema(
  stockMovements
).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertSessionInventorySnapshotSchema = createInsertSchema(
  sessionInventorySnapshots
).omit({
  id: true,
  createdAt: true,
});

// Custom schemas for complex operations
export const newPurchaseSchema = z.object({
  supplierId: z.string().uuid().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      quantity: z.preprocess(
        (val) => parseFloat(String(val)),
        z.number().positive("Quantity must be positive")
      ),
      totalCost: z.preprocess(
        (val) => parseFloat(String(val)),
        z.number().positive("Total cost must be positive")
      ),
    })
  ),
});

export const newSaleSchema = z.object({
  sessionId: z.string().uuid().optional(),
  paymentType: z.enum(["CASH", "CARD", "OTHER"]),
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      qty: z.number().int().positive(),
    })
  ),
});

export const stockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.string().min(1),
  note: z.string().optional(),
});

export const openSessionSchema = z.object({
  openingFloat: z.preprocess(
    (val) => (val ? parseFloat(String(val)) : undefined),
    z.number({ required_error: "Opening float is required" }).min(0)
  ),
  notes: z.string().optional(),
  inventory: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.string().min(1, "Quantity is required"),
      })
    )
    .min(1, "At least one inventory item is required"),
});

export const closeSessionSchema = z.object({
  closingFloat: z.preprocess(
    (val) => (val ? parseFloat(String(val)) : undefined),
    z.number({ required_error: "Closing float is required" }).min(0)
  ),
  notes: z.string().optional(),
  inventory: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.string().min(1, "Quantity is required"),
      })
    )
    .min(1, "At least one inventory item is required"),
});

export const newItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  type: z.enum(["RAW", "MANUFACTURED", "SELLABLE"]),
  unit: z.string().min(1, "Unit is required"),
  price: z.preprocess(
    (val) => (val ? parseFloat(String(val)) : undefined),
    z.number().min(0).optional()
  ),
  lowStockLevel: z.preprocess(
    (val) => (val ? parseFloat(String(val)) : undefined),
    z.number().min(0).optional()
  ),
  recipe: z
    .array(
      z.object({
        childItemId: z.string().uuid(),
        quantity: z.preprocess(
          (val) => (val ? parseFloat(String(val)) : undefined),
          z.number({ required_error: "Quantity is required" }).min(0)
        ),
      })
    )
    .optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Purchase = typeof purchases.$inferSelect & {
  items?: PurchaseItem[];
};
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
export type InventoryLot = typeof inventoryLots.$inferSelect;
export type InsertInventoryLot = z.infer<typeof insertInventoryLotSchema>;
export type RecipeItem = typeof recipeItems.$inferSelect;
export type InsertRecipeItem = z.infer<typeof insertRecipeItemSchema>;
export type CashSession = typeof cashSessions.$inferSelect;
export type InsertCashSession = z.infer<typeof insertCashSessionSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type SessionInventorySnapshot = z.infer<
  typeof insertSessionInventorySnapshotSchema
>;

// Complex operation types
export type NewPurchase = z.infer<typeof newPurchaseSchema>;
export type NewSale = z.infer<typeof newSaleSchema>;
export type StockAdjustment = z.infer<typeof stockAdjustmentSchema>;
export type OpenSessionRequest = z.infer<typeof openSessionSchema>;
export type CloseSessionRequest = z.infer<typeof closeSessionSchema>;
export type NewItem = z.infer<typeof newItemSchema>;
