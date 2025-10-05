import {
  type User,
  type InsertUser,
  type Item,
  type InsertItem,
  type Supplier,
  type InsertSupplier,
  type Purchase,
  type InsertPurchase,
  type PurchaseItem,
  type InsertPurchaseItem,
  type InventoryLot,
  type InsertInventoryLot,
  type RecipeItem,
  type InsertRecipeItem,
  type CashSession,
  type InsertCashSession,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  type StockMovement,
  type InsertStockMovement,
  type Expense,
  type InsertExpense,
  type NewPurchase,
  type NewSale,
  type StockAdjustment,
  type OpenSessionRequest,
  type NewItem,
} from "@shared/schema";
import { randomUUID } from "crypto";

export type SafeUser = Omit<User, "password">;

export interface IStorage {
  // Users
  getUser(id: string): Promise<SafeUser | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<SafeUser>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<SafeUser>;
  loginUser(email: string, password: string): Promise<SafeUser | null>; // Returns user without password if credentials match
  getUsers(): Promise<SafeUser[]>;

  // Items (replaces Ingredients and Products)
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  getItemByName(name: string): Promise<Item | undefined>;
  getItemBySku(sku: string): Promise<Item | undefined>;
  createItem(item: NewItem): Promise<Item>;
  updateItem(id: string, item: Partial<InsertItem>): Promise<Item>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;

  // Recipe Items
  getRecipeItems(parentItemId: string): Promise<RecipeItem[]>;
  createRecipeItem(recipeItem: InsertRecipeItem): Promise<RecipeItem>;
  deleteRecipeItems(parentItemId: string): Promise<void>;

  // Inventory Lots
  getInventoryLots(itemId: string): Promise<InventoryLot[]>;
  createInventoryLot(lot: InsertInventoryLot): Promise<InventoryLot>;
  updateInventoryLot(
    id: string,
    lot: Partial<InsertInventoryLot>
  ): Promise<InventoryLot>;

  // Purchases
  createPurchase(purchase: NewPurchase): Promise<Purchase>;
  getPurchases(): Promise<Purchase[]>;

  // Stock Movements
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  getStockMovements(itemId?: string): Promise<StockMovement[]>;

  // Stock Adjustments
  adjustStock(adjustment: StockAdjustment): Promise<void>;

  // Sales
  createSale(sale: NewSale, userId: string): Promise<Sale>;
  getSales(from?: Date, to?: Date): Promise<Sale[]>;
  getSaleItems(saleId: string): Promise<SaleItem[]>;

  // Cash Sessions
  getActiveCashSession(): Promise<CashSession | undefined>;
  openCashSession(session: InsertCashSession): Promise<CashSession>;
  closeCashSession(
    sessionId: string,
    closingFloat: string,
    notes?: string,
    closedBy?: string
  ): Promise<CashSession>;
  getCashSessions(): Promise<CashSession[]>;
  openSessionAndMoveStock(
    sessionData: OpenSessionRequest,
    userId: string
  ): Promise<CashSession>;
  createInventorySnapshots(
    sessionId: string,
    snapshots: { ingredientId: string; quantity: string }[],
    type: "OPENING" | "CLOSING"
  ): Promise<void>;
  updateStockForSession(
    sessionId: string,
    snapshots: { ingredientId: string; quantity: string }[],
    type: "OPENING" | "CLOSING"
  ): Promise<void>;

  // Expenses
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpenses(): Promise<Expense[]>;

  // Reports
  getCurrentStock(): Promise<
    {
      itemId: string;
      itemName: string;
      totalQuantity: string;
      unit: string;
      lowStockLevel: string | null;
    }[]
  >;
  getLowStockItems(): Promise<
    {
      itemId: string;
      itemName: string;
      totalQuantity: string;
      unit: string;
      lowStockLevel: string;
    }[]
  >;
  getTodayKPIs(): Promise<{
    revenue: string;
    cogs: string;
    grossMargin: string;
    orderCount: number;
  }>;
  getTopProducts(
    from: Date,
    to: Date
  ): Promise<
    {
      itemId: string;
      itemName: string;
      sku: string;
      totalQty: number;
      totalRevenue: string;
    }[]
  >;
  getRecentActivity(limit: number): Promise<any[]>;
  getPendingOrders(): Promise<
    { sale: Sale; items: (SaleItem & { itemName: string })[] }[]
  >;
  updateSaleItemStatus(id: string, status: string): Promise<SaleItem>;
}

import { SqliteStorage } from "./sqlite-storage";

export const storage = new SqliteStorage();
