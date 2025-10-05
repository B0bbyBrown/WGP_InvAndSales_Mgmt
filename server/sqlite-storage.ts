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
  users,
  items,
  suppliers,
  purchases,
  purchaseItems,
  inventoryLots,
  recipeItems,
  cashSessions,
  sales,
  saleItems,
  stockMovements,
  expenses,
  sessionInventorySnapshots,
} from "@shared/schema";
import { IStorage, SafeUser } from "./storage";
import { db, sqlite } from "./db";
import { eq, and, desc, asc, sum, sql, isNull, inArray, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Utility functions for type conversion
const toNum = (value: string | number | null): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === "string" ? parseFloat(value) : value;
};

const toStr = (value: number | null): string => {
  if (value === null || value === undefined) return "0";
  return value.toString();
};

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export class SqliteStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<SafeUser | undefined> {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async loginUser(email: string, password: string): Promise<SafeUser | null> {
    try {
      const user = await this.getUserByEmail(email);

      if (!user) {
        return null;
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return null;
      }

      const { password: _, ...safeUser } = user;
      return safeUser;
    } catch (err) {
      console.error("Error during login:", err);
      return null;
    }
  }

  async getUsers(): Promise<SafeUser[]> {
    const allUsers = await db.query.users.findMany();
    return allUsers.map(({ password: _, ...safeUser }) => safeUser);
  }

  async createUser(user: InsertUser): Promise<SafeUser> {
    const [created] = await db.insert(users).values(user).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });
    return created;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<SafeUser> {
    const [updated] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return updated;
  }

  // Items (replaces Ingredients and Products)
  async getItems(): Promise<Item[]> {
    return await db.select().from(items).orderBy(asc(items.name));
  }

  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItemByName(name: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.name, name));
    return item;
  }

  async getItemBySku(sku: string): Promise<Item | undefined> {
    if (!sku) return undefined;
    const [item] = await db.select().from(items).where(eq(items.sku, sku));
    return item;
  }

  async createItem(item: NewItem): Promise<Item> {
    const createdItem = sqlite.transaction(() => {
      const newItem = db
        .insert(items)
        .values({
          name: item.name,
          sku: item.sku,
          type: item.type,
          unit: item.unit,
          price: item.price ? toNum(item.price) : null,
          lowStockLevel: item.lowStockLevel
            ? toNum(item.lowStockLevel)
            : null,
        })
        .returning()
        .get();

      if (!newItem) {
        throw new Error("Failed to create item");
      }

      // Add initial stock for RAW items that are not sellable without a recipe
      if (item.type === "RAW" || (item.type === "SELLABLE" && !item.recipe)) {
        db.insert(inventoryLots)
          .values({
            itemId: newItem.id,
            quantity: 100, // Generous starting stock
            unitCost: 0.5, // Arbitrary cost
          })
          .run();
      }

      if (item.recipe && item.recipe.length > 0) {
        if (newItem.type === "RAW") {
          throw new Error("RAW items cannot have a recipe.");
        }
        for (const recipeItem of item.recipe) {
          db.insert(recipeItems)
            .values({
              parentItemId: newItem.id,
              childItemId: recipeItem.childItemId,
              quantity: toNum(recipeItem.quantity),
            })
            .run();
        }
      }

      return newItem;
    })();

    return createdItem;
  }

  async updateItem(id: string, item: Partial<InsertItem>): Promise<Item> {
    const [updated] = await db
      .update(items)
      .set({
        ...item,
        price: item.price ? toNum(item.price) : undefined,
        lowStockLevel: item.lowStockLevel
          ? toNum(item.lowStockLevel)
          : undefined,
      })
      .where(eq(items.id, id))
      .returning();
    return updated;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(asc(suppliers.name));
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(supplier).returning();
    return created;
  }

  // Recipe Items
  async getRecipeItems(parentItemId: string): Promise<RecipeItem[]> {
    return await db
      .select()
      .from(recipeItems)
      .where(eq(recipeItems.parentItemId, parentItemId));
  }

  async createRecipeItem(recipeItem: InsertRecipeItem): Promise<RecipeItem> {
    const [created] = await db
      .insert(recipeItems)
      .values({
        ...recipeItem,
        quantity: toNum(recipeItem.quantity),
      })
      .returning();
    return created;
  }

  async deleteRecipeItems(parentItemId: string): Promise<void> {
    if (!parentItemId) return;
    await db
      .delete(recipeItems)
      .where(eq(recipeItems.parentItemId, parentItemId));
  }

  // Inventory Lots
  async getInventoryLots(itemId: string): Promise<InventoryLot[]> {
    return await db
      .select()
      .from(inventoryLots)
      .where(eq(inventoryLots.itemId, itemId))
      .orderBy(asc(inventoryLots.purchasedAt)); // FIFO order
  }

  async createInventoryLot(lot: InsertInventoryLot): Promise<InventoryLot> {
    const [created] = await db
      .insert(inventoryLots)
      .values({
        ...lot,
        quantity: toNum(lot.quantity),
        unitCost: toNum(lot.unitCost),
      })
      .returning();
    return created;
  }

  async updateInventoryLot(
    id: string,
    lot: Partial<InsertInventoryLot>
  ): Promise<InventoryLot> {
    const [updated] = await db
      .update(inventoryLots)
      .set({
        ...lot,
        quantity: lot.quantity ? toNum(lot.quantity) : undefined,
        unitCost: lot.unitCost ? toNum(lot.unitCost) : undefined,
      })
      .where(eq(inventoryLots.id, id))
      .returning();
    return updated;
  }

  // Purchases (transaction)
  async createPurchase(purchase: NewPurchase): Promise<Purchase> {
    return new Promise((resolve, reject) => {
      try {
        const createdPurchase = sqlite.transaction(() => {
          const created = db
            .insert(purchases)
            .values({
              supplierId: purchase.supplierId || null,
              notes: purchase.notes || null,
            })
            .returning()
            .get();

          if (!created) {
            throw new Error("Failed to create purchase");
          }

          for (const item of purchase.items) {
            const quantity = toNum(item.quantity);
            const totalCost = toNum(item.totalCost);
            const unitCost = totalCost / quantity;

            db.insert(purchaseItems)
              .values({
                purchaseId: created.id,
                itemId: item.itemId,
                quantity,
                totalCost,
              })
              .run();

            db.insert(inventoryLots)
              .values({
                itemId: item.itemId,
                quantity,
                unitCost,
              })
              .run();

            db.insert(stockMovements)
              .values({
                kind: "PURCHASE",
                itemId: item.itemId,
                quantity,
                reference: created.id,
              })
              .run();
          }

          const purchaseItemsResult = db
            .select()
            .from(purchaseItems)
            .where(eq(purchaseItems.purchaseId, created.id))
            .all();

          return { ...created, items: purchaseItemsResult };
        })();
        resolve(createdPurchase);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getPurchases(): Promise<Purchase[]> {
    const allPurchases = await db
      .select()
      .from(purchases)
      .orderBy(desc(purchases.createdAt));

    if (allPurchases.length === 0) {
      return [];
    }

    const purchaseIds = allPurchases.map((p) => p.id);
    const allItems = await db
      .select()
      .from(purchaseItems)
      .where(inArray(purchaseItems.purchaseId, purchaseIds));

    return allPurchases.map((p) => ({
      ...p,
      items: allItems.filter((item) => item.purchaseId === p.id),
    }));
  }

  // Stock Movements
  async createStockMovement(
    movement: InsertStockMovement
  ): Promise<StockMovement> {
    const [created] = await db
      .insert(stockMovements)
      .values({
        ...movement,
        quantity: toNum(movement.quantity),
      })
      .returning();
    return created;
  }

  async getStockMovements(itemId?: string): Promise<StockMovement[]> {
    if (itemId) {
      return await db
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.itemId, itemId))
        .orderBy(desc(stockMovements.createdAt));
    }
    return await db
      .select()
      .from(stockMovements)
      .orderBy(desc(stockMovements.createdAt));
  }

  // Stock Adjustments (transaction)
  async adjustStock(adjustment: StockAdjustment): Promise<void> {
    const quantity = toNum(adjustment.quantity);

    db.transaction((tx) => {
      if (quantity > 0) {
        tx.insert(inventoryLots)
          .values({
            itemId: adjustment.itemId,
            quantity,
            unitCost: 0,
          })
          .run();
      } else {
        const lots = tx
          .select()
          .from(inventoryLots)
          .where(eq(inventoryLots.itemId, adjustment.itemId))
          .orderBy(asc(inventoryLots.purchasedAt))
          .all();

        const totalAvailable = lots.reduce(
          (sum, lot) => sum + lot.quantity,
          0
        );
        const requiredQty = Math.abs(quantity);

        if (totalAvailable < requiredQty) {
          throw new Error(
            `Insufficient inventory. Available: ${totalAvailable}, Required: ${requiredQty}`
          );
        }

        let remaining = requiredQty;

        for (const lot of lots) {
          if (remaining <= 0) break;
          const lotQuantity = lot.quantity;
          const consumed = Math.min(remaining, lotQuantity);

          tx.update(inventoryLots)
            .set({ quantity: lotQuantity - consumed })
            .where(eq(inventoryLots.id, lot.id))
            .run();

          remaining -= consumed;
        }
      }

      tx.insert(stockMovements)
        .values({
          kind: quantity > 0 ? "ADJUSTMENT" : "WASTAGE",
          itemId: adjustment.itemId,
          quantity,
          note: adjustment.note,
        })
        .run();
    });
  }

  // Sales (transaction with recursive FIFO COGS calculation)
  async createSale(sale: NewSale, userId: string): Promise<Sale> {
    const createdSale = sqlite.transaction(() => {
      let totalRevenue = 0;
      let totalCogs = 0;
      const saleItemsData = [];
      const stockMovementsToCreate: Omit<
        InsertStockMovement,
        "id" | "createdAt" | "reference"
      >[] = [];

      const consumeItemRecursive = (
        itemId: string,
        quantityToConsume: number
      ): number => {
        let calculatedCost = 0;

        const recipe = db
          .select()
          .from(recipeItems)
          .where(eq(recipeItems.parentItemId, itemId))
          .all();

        if (recipe.length > 0) {
          // It's a MANUFACTURED item, recurse through its components
          for (const component of recipe) {
            const requiredChildQty = component.quantity * quantityToConsume;
            calculatedCost += consumeItemRecursive(
              component.childItemId,
              requiredChildQty
            );
          }
        } else {
          // It's a RAW item, consume from inventory lots (base case)
          const lots = db
            .select()
            .from(inventoryLots)
            .where(eq(inventoryLots.itemId, itemId))
            .orderBy(asc(inventoryLots.purchasedAt))
            .all();

          const totalAvailable = lots.reduce(
            (sum, lot) => sum + lot.quantity,
            0
          );
          if (totalAvailable < quantityToConsume) {
            throw new Error(
              `Insufficient inventory for item ID ${itemId}. Available: ${totalAvailable}, Required: ${quantityToConsume}`
            );
          }

          let remainingToConsume = quantityToConsume;
          for (const lot of lots) {
            if (remainingToConsume <= 0) break;

            const consumed = Math.min(remainingToConsume, lot.quantity);
            calculatedCost += consumed * lot.unitCost;

            db.update(inventoryLots)
              .set({ quantity: lot.quantity - consumed })
              .where(eq(inventoryLots.id, lot.id))
              .run();

            remainingToConsume -= consumed;

            stockMovementsToCreate.push({
              kind: "SALE_CONSUME",
              itemId: itemId,
              quantity: -consumed,
            });
          }
        }
        return calculatedCost;
      };

      for (const item of sale.items) {
        const product = db
          .select()
          .from(items)
          .where(eq(items.id, item.itemId))
          .get();
        if (!product || product.type !== "SELLABLE" || !product.price) {
          throw new Error(`Item not found or not sellable: ${item.itemId}`);
        }

        const unitPrice = product.price;
        const lineTotal = unitPrice * item.qty;
        totalRevenue += lineTotal;

        saleItemsData.push({
          itemId: item.itemId,
          qty: item.qty,
          unitPrice,
          lineTotal,
        });

        totalCogs += consumeItemRecursive(item.itemId, item.qty);
      }

      const created = db
        .insert(sales)
        .values({
          sessionId: sale.sessionId || null,
          userId,
          total: totalRevenue,
          cogs: totalCogs,
          paymentType: sale.paymentType,
        })
        .returning()
        .get();

      if (!created) {
        throw new Error("Failed to create sale");
      }

      for (const itemData of saleItemsData) {
        db.insert(saleItems)
          .values({
            saleId: created.id,
            ...itemData,
          })
          .run();
      }

      for (const movement of stockMovementsToCreate) {
        db.insert(stockMovements)
          .values({
            ...movement,
            reference: created.id,
          })
          .run();
      }

      return created;
    })();

    return createdSale;
  }

  async getSales(from?: Date, to?: Date): Promise<Sale[]> {
    if (from && to) {
      return await db
        .select()
        .from(sales)
        .where(
          and(
            sql`${sales.createdAt} >= ${Math.floor(from.getTime() / 1000)}`,
            sql`${sales.createdAt} <= ${Math.floor(to.getTime() / 1000)}`
          )
        )
        .orderBy(desc(sales.createdAt));
    }

    return await db.select().from(sales).orderBy(desc(sales.createdAt));
  }

  async getSaleItems(saleId: string): Promise<SaleItem[]> {
    return await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  }

  // Cash Sessions (methods using 'itemId' need to be checked)
  // I will update openSessionAndMoveStock, createInventorySnapshots, updateStockForSession
  async getActiveCashSession(): Promise<CashSession | undefined> {
    const [session] = await db
      .select()
      .from(cashSessions)
      .where(isNull(cashSessions.closedAt));
    return session;
  }

  async openCashSession(session: InsertCashSession): Promise<CashSession> {
    const [created] = await db
      .insert(cashSessions)
      .values({
        ...session,
        openingFloat: session.openingFloat ? toNum(session.openingFloat) : 0,
      })
      .returning();
    return created;
  }

  async closeCashSession(
    sessionId: string,
    closingFloat: string,
    notes?: string,
    closedBy?: string
  ): Promise<CashSession> {
    const [updated] = await db
      .update(cashSessions)
      .set({
        closedAt: new Date(),
        closingFloat: toNum(closingFloat),
        notes,
        closedBy,
      })
      .where(eq(cashSessions.id, sessionId))
      .returning();
    return updated;
  }

  async openSessionAndMoveStock(
    sessionData: OpenSessionRequest,
    userId: string
  ): Promise<CashSession> {
    return sqlite.transaction(() => {
      const session = db
        .insert(cashSessions)
        .values({
          openingFloat: sessionData.openingFloat,
          notes: sessionData.notes,
          openedBy: userId,
        })
        .returning()
        .get();

      if (!session) {
        throw new Error("Failed to create cash session");
      }

      this.updateStockForSession(session.id, sessionData.inventory, "OPENING");
      this.createInventorySnapshots(
        session.id,
        sessionData.inventory,
        "OPENING"
      );

      return session;
    })();
  }

  async getCashSessions(): Promise<CashSession[]> {
    return await db
      .select()
      .from(cashSessions)
      .orderBy(desc(cashSessions.openedAt));
  }

  async createInventorySnapshots(
    sessionId: string,
    snapshots: { itemId: string; quantity: string }[],
    type: "OPENING" | "CLOSING"
  ): Promise<void> {
    if (snapshots.length === 0) return;

    const snapshotData = snapshots.map((s) => ({
      sessionId,
      itemId: s.itemId,
      quantity: toNum(s.quantity),
      type,
    }));

    await db.insert(sessionInventorySnapshots).values(snapshotData);
  }

  async updateStockForSession(
    sessionId: string,
    snapshots: { itemId: string; quantity: string }[],
    type: "OPENING" | "CLOSING"
  ): Promise<void> {
    db.transaction((tx) => {
      for (const snapshot of snapshots) {
        const quantity = toNum(snapshot.quantity);
        if (quantity === 0) continue;

        const isOpening = type === "OPENING";
        const movementQuantity = isOpening ? -quantity : quantity;

        if (isOpening) {
          const lots = tx
            .select()
            .from(inventoryLots)
            .where(eq(inventoryLots.itemId, snapshot.itemId))
            .orderBy(asc(inventoryLots.purchasedAt))
            .all();

          const totalAvailable = lots.reduce(
            (sum, lot) => sum + lot.quantity,
            0
          );
          if (totalAvailable < quantity) {
            throw new Error(
              `Insufficient inventory for session. Available: ${totalAvailable}, Required: ${quantity}`
            );
          }

          let remaining = quantity;
          for (const lot of lots) {
            if (remaining <= 0) break;
            const lotQuantity = lot.quantity;
            const consumed = Math.min(remaining, lotQuantity);

            tx.update(inventoryLots)
              .set({ quantity: lotQuantity - consumed })
              .where(eq(inventoryLots.id, lot.id))
              .run();

            remaining -= consumed;
          }
        } else {
          tx.insert(inventoryLots)
            .values({
              itemId: snapshot.itemId,
              quantity,
              unitCost: 0,
              purchasedAt: new Date(),
            })
            .run();
        }

        tx.insert(stockMovements)
          .values({
            kind: isOpening ? "SESSION_OUT" : "SESSION_IN",
            itemId: snapshot.itemId,
            quantity: movementQuantity,
            reference: sessionId,
          })
          .run();
      }
    });
  }

  // Expenses (no change needed)
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db
      .insert(expenses)
      .values({
        ...expense,
        amount: toNum(expense.amount),
      })
      .returning();
    return created;
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }

  // Reports
  async getCurrentStock(): Promise<
    {
      itemId: string;
      itemName: string;
      totalQuantity: string;
      unit: string;
      lowStockLevel: string | null;
    }[]
  > {
    const result = await db
      .select({
        itemId: items.id,
        itemName: items.name,
        totalQuantity: sum(inventoryLots.quantity),
        unit: items.unit,
        lowStockLevel: items.lowStockLevel,
      })
      .from(items)
      .leftJoin(inventoryLots, eq(items.id, inventoryLots.itemId))
      .groupBy(items.id, items.name, items.unit, items.lowStockLevel)
      .orderBy(asc(items.name));

    return result.map((row) => ({
      ...row,
      totalQuantity: toStr(toNum(row.totalQuantity)),
      lowStockLevel: row.lowStockLevel ? toStr(toNum(row.lowStockLevel)) : null,
    }));
  }

  async getLowStockItems(): Promise<
    {
      itemId: string;
      itemName: string;
      totalQuantity: string;
      unit: string;
      lowStockLevel: string;
    }[]
  > {
    const result = await db
      .select({
        itemId: inventoryLots.itemId,
        itemName: items.name,
        totalQuantity: sum(inventoryLots.quantity),
        unit: items.unit,
        lowStockLevel: items.lowStockLevel,
      })
      .from(inventoryLots)
      .innerJoin(items, eq(inventoryLots.itemId, items.id))
      .where(sql`${items.lowStockLevel} IS NOT NULL`)
      .groupBy(
        inventoryLots.itemId,
        items.name,
        items.unit,
        items.lowStockLevel
      )
      .having(sql`SUM(${inventoryLots.quantity}) < ${items.lowStockLevel}`);

    return result.map((row) => ({
      ...row,
      totalQuantity: toStr(toNum(row.totalQuantity)),
      lowStockLevel: toStr(toNum(row.lowStockLevel!)),
    }));
  }

  async getTodayKPIs(): Promise<{
    revenue: string;
    cogs: string;
    grossMargin: string;
    orderCount: number;
  }> {
    const { start, end } = todayRange();
    
    const result = await db
      .select({
        revenue: sum(sales.total),
        cogs: sum(sales.cogs),
        orderCount: sql<number>`COUNT(CASE WHEN total > 0 THEN 1 END)`,
      })
      .from(sales)
      .where(
        and(
          sql`${sales.createdAt} >= ${Math.floor(start.getTime() / 1000)}`,
          sql`${sales.createdAt} <= ${Math.floor(end.getTime() / 1000)}`
        )
      );

    const data = result[0];
    const revenue = toNum(data?.revenue || 0);
    const cogs = toNum(data?.cogs || 0);
    const grossMargin = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0;

    return {
      revenue: toStr(revenue),
      cogs: toStr(cogs),
      grossMargin: toStr(grossMargin),
      orderCount: data?.orderCount || 0,
    };
  }

  async getTopProducts(
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
  > {
    const result = await db
      .select({
        itemId: saleItems.itemId,
        itemName: items.name,
        sku: items.sku,
        totalQty: sum(saleItems.qty),
        totalRevenue: sum(saleItems.lineTotal),
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(items, eq(saleItems.itemId, items.id))
      .where(
        and(
          sql`${sales.createdAt} >= ${Math.floor(from.getTime() / 1000)}`,
          sql`${sales.createdAt} <= ${Math.floor(to.getTime() / 1000)}`
        )
      )
      .groupBy(saleItems.itemId, items.name, items.sku)
      .orderBy(desc(sum(saleItems.lineTotal)));

    return result.map((row) => ({
      ...row,
      totalQty: Number(row.totalQty || 0),
      totalRevenue: toStr(toNum(row.totalRevenue || 0)),
    }));
  }

  async getRecentActivity(limit: number): Promise<any[]> {
    const half = Math.max(1, Math.floor(limit / 2));

    const recentSales = await db
      .select({
        type: sql<string>`'sale'`,
        id: sales.id,
        description: sql<string>`'Sale of $' || ${sales.total}`,
        amount: sales.total,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .orderBy(desc(sales.createdAt))
      .limit(half);

    const recentExpenses = await db
      .select({
        type: sql<string>`'expense'`,
        id: expenses.id,
        description: expenses.label,
        amount: expenses.amount,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .orderBy(desc(expenses.createdAt))
      .limit(half);

    const combined = [...recentSales, ...recentExpenses]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return combined.map((item) => ({
      ...item,
      amount: toStr(item.amount),
    }));
  }

  async getPendingOrders(): Promise<
    { sale: Sale; items: (SaleItem & { itemName: string })[] }[]
  > {
    const pendingItems = await db
      .select({
        ...saleItems,
        itemName: items.name,
      })
      .from(saleItems)
      .innerJoin(items, eq(saleItems.itemId, items.id))
      .where(ne(saleItems.status, "DONE"));
    const saleIds = [...new Set(pendingItems.map((i) => i.saleId))];
    if (saleIds.length === 0) return [];

    const pendingSales = await db
      .select()
      .from(sales)
      .where(inArray(sales.id, saleIds))
      .orderBy(desc(sales.createdAt));

    return pendingSales.map((s) => ({
      sale: s,
      items: pendingItems.filter((i) => i.saleId === s.id),
    }));
  }

  async updateSaleItemStatus(id: string, status: string): Promise<SaleItem> {
    const validStatuses = ["PENDING", "RECEIVED", "PREPPING", "DONE"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }
    const [updated] = await db
      .update(saleItems)
      .set({ status })
      .where(eq(saleItems.id, id))
      .returning();
    if (!updated) {
      throw new Error("Sale item not found");
    }
    return updated;
  }
}
