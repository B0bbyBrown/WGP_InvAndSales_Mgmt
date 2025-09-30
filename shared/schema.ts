import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { text, integer, real, sqliteTable } from "drizzle-orm/sqlite-core";
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

// Ingredients table
export const ingredients = sqliteTable("ingredients", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").unique().notNull(),
  unit: text("unit").notNull(),
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

// Products table
export const products = sqliteTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").unique().notNull(),
  sku: text("sku").unique().notNull(),
  price: real("price").notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
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
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  ingredientId: text("ingredient_id")
    .references(() => ingredients.id)
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
export const saleItems = sqliteTable("sale_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  saleId: text("sale_id")
    .references(() => sales.id)
    .notNull(),
  productId: text("product_id")
    .references(() => products.id)
    .notNull(),
  qty: integer("qty").notNull(),
  unitPrice: real("unit_price").notNull(),
  lineTotal: real("line_total").notNull(),
});

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
  ingredientId: text("ingredient_id")
    .references(() => ingredients.id)
    .notNull(),
  quantity: real("quantity").notNull(),
  totalCost: real("total_cost").notNull(),
});

// Inventory lots table
export const inventoryLots = sqliteTable("inventory_lots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ingredientId: text("ingredient_id")
    .references(() => ingredients.id)
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
  ingredientId: text("ingredient_id")
    .references(() => ingredients.id)
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
    ingredientId: text("ingredient_id")
      .references(() => ingredients.id)
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

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
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
      ingredientId: z.string().uuid(),
      quantity: z.string().min(1),
      totalCost: z.string().min(1),
    })
  ),
});

export const newSaleSchema = z.object({
  sessionId: z.string().uuid().optional(),
  paymentType: z.enum(["CASH", "CARD", "OTHER"]),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      qty: z.number().int().positive(),
    })
  ),
});

export const stockAdjustmentSchema = z.object({
  ingredientId: z.string().uuid(),
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
        ingredientId: z.string().uuid(),
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
        ingredientId: z.string().uuid(),
        quantity: z.string().min(1, "Quantity is required"),
      })
    )
    .min(1, "At least one inventory item is required"),
});

export const newProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.preprocess(
    (val) => (val ? parseFloat(String(val)) : undefined),
    z.number({ required_error: "Price is required" }).min(0)
  ),
  active: z.boolean().default(true),
  recipe: z
    .array(
      z.object({
        ingredientId: z.string().uuid(),
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
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Purchase = typeof purchases.$inferSelect;
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
export type NewProduct = z.infer<typeof newProductSchema>;
