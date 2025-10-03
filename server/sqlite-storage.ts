import {
  type User,
  type InsertUser,
  type Ingredient,
  type InsertIngredient,
  type Supplier,
  type InsertSupplier,
  type Product,
  type InsertProduct,
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
  users,
  ingredients,
  suppliers,
  products,
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

  // Ingredients
  async getIngredients(): Promise<Ingredient[]> {
    return await db.select().from(ingredients).orderBy(asc(ingredients.name));
  }

  async getIngredient(id: string): Promise<Ingredient | undefined> {
    const [ingredient] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.id, id));
    return ingredient;
  }

  async getIngredientByName(name: string): Promise<Ingredient | undefined> {
    const [ingredient] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.name, name));
    return ingredient;
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [created] = await db
      .insert(ingredients)
      .values({
        ...ingredient,
        lowStockLevel: ingredient.lowStockLevel
          ? toNum(ingredient.lowStockLevel)
          : null,
      })
      .returning();
    return created;
  }

  async updateIngredient(
    id: string,
    ingredient: Partial<InsertIngredient>
  ): Promise<Ingredient> {
    const [updated] = await db
      .update(ingredients)
      .set({
        ...ingredient,
        lowStockLevel: ingredient.lowStockLevel
          ? toNum(ingredient.lowStockLevel)
          : undefined,
      })
      .where(eq(ingredients.id, id))
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

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.name));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async createProduct(product: {
    name: string;
    sku: string;
    price: string | number;
    active?: boolean;
  }): Promise<Product> {
    const [created] = await db
      .insert(products)
      .values({
        name: product.name,
        sku: product.sku,
        price: toNum(product.price),
        active: product.active ?? true,
      })
      .returning();
    return created;
  }

  async updateProduct(
    id: string,
    product: Partial<InsertProduct>
  ): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({
        ...product,
        price: product.price ? toNum(product.price) : undefined,
      })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  // Recipe Items
  async getRecipeItems(productId: string): Promise<RecipeItem[]> {
    return await db
      .select()
      .from(recipeItems)
      .where(eq(recipeItems.productId, productId));
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

  async deleteRecipeItems(productId: string): Promise<void> {
    await db.delete(recipeItems).where(eq(recipeItems.productId, productId));
  }

  // Inventory Lots
  async getInventoryLots(ingredientId: string): Promise<InventoryLot[]> {
    return await db
      .select()
      .from(inventoryLots)
      .where(eq(inventoryLots.ingredientId, ingredientId))
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
    return sqlite.transaction(() => {
      // Create the purchase record
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

      // Process each purchase item
      for (const item of purchase.items) {
        const quantity = toNum(item.quantity);
        const totalCost = toNum(item.totalCost);
        const unitCost = totalCost / quantity;

        // Insert purchase item
        db.insert(purchaseItems)
          .values({
            purchaseId: created.id,
            ingredientId: item.ingredientId,
            quantity,
            totalCost,
          })
          .run();

        // Create inventory lot
        db.insert(inventoryLots)
          .values({
            ingredientId: item.ingredientId,
            quantity,
            unitCost,
          })
          .run();

        // Create stock movement
        db.insert(stockMovements)
          .values({
            kind: "PURCHASE",
            ingredientId: item.ingredientId,
            quantity,
            reference: created.id,
          })
          .run();
      }

      return created;
    })();
  }

  async getPurchases(): Promise<Purchase[]> {
    return await db.select().from(purchases).orderBy(desc(purchases.createdAt));
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

  async getStockMovements(ingredientId?: string): Promise<StockMovement[]> {
    if (ingredientId) {
      return await db
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.ingredientId, ingredientId))
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

    // The transaction callback only receives `tx`.
    // The inner function has access to `adjustment` and `quantity` from the outer scope.
    db.transaction((tx) => {
      if (quantity > 0) {
        // Positive adjustment - add inventory lot
        tx.insert(inventoryLots)
          .values({
            ingredientId: adjustment.ingredientId,
            quantity,
            unitCost: 0, // Adjustment items have no cost
          })
          .run();
      } else {
        // Negative adjustment - consume inventory via FIFO
        const lots = tx
          .select()
          .from(inventoryLots)
          .where(eq(inventoryLots.ingredientId, adjustment.ingredientId))
          .orderBy(asc(inventoryLots.purchasedAt))
          .all();

        // Check if we have enough inventory
        const totalAvailable = lots.reduce((sum, lot) => sum + lot.quantity, 0);
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
            .set({
              quantity: lotQuantity - consumed,
            })
            .where(eq(inventoryLots.id, lot.id))
            .run();

          remaining -= consumed;
        }
      }

      // Create stock movement record
      tx.insert(stockMovements)
        .values({
          kind: quantity > 0 ? "ADJUSTMENT" : "WASTAGE",
          ingredientId: adjustment.ingredientId,
          quantity,
          note: adjustment.note,
        })
        .run();
    });
  }

  // Sales (transaction with FIFO COGS calculation)
  async createSale(sale: NewSale, userId: string): Promise<Sale> {
    return sqlite.transaction(() => {
      let totalRevenue = 0;
      let totalCogs = 0;
      const saleItemsData = [];
      const stockMovementsData = [];

      // Process each sale item - all calculations inside transaction
      for (const item of sale.items) {
        // Get product inside transaction
        const product = db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .get();
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const unitPrice = product.price;
        const lineTotal = unitPrice * item.qty;
        totalRevenue += lineTotal;

        saleItemsData.push({
          productId: item.productId,
          qty: item.qty,
          unitPrice,
          lineTotal,
        });

        // Get recipe inside transaction
        const recipe = db
          .select()
          .from(recipeItems)
          .where(eq(recipeItems.productId, item.productId))
          .all();

        for (const recipeItem of recipe) {
          const requiredQty = recipeItem.quantity * item.qty;
          let remaining = requiredQty;

          // Get inventory lots for this ingredient (FIFO order) inside transaction
          const lots = db
            .select()
            .from(inventoryLots)
            .where(eq(inventoryLots.ingredientId, recipeItem.ingredientId))
            .orderBy(asc(inventoryLots.purchasedAt))
            .all();

          // Check if we have enough inventory
          const totalAvailable = lots.reduce(
            (sum, lot) => sum + lot.quantity,
            0
          );
          if (totalAvailable < requiredQty) {
            throw new Error(
              `Insufficient inventory for ingredient. Available: ${totalAvailable}, Required: ${requiredQty}`
            );
          }

          // Consume inventory using FIFO
          for (const lot of lots) {
            if (remaining <= 0) break;

            const consumed = Math.min(remaining, lot.quantity);
            totalCogs += consumed * lot.unitCost;

            // Update lot quantity immediately
            db.update(inventoryLots)
              .set({
                quantity: lot.quantity - consumed,
              })
              .where(eq(inventoryLots.id, lot.id))
              .run();

            remaining -= consumed;

            // Queue stock movement for consumption
            stockMovementsData.push({
              kind: "SALE_CONSUME" as const,
              ingredientId: recipeItem.ingredientId,
              quantity: -consumed, // Negative for consumption
              reference: "", // Will update with sale ID
            });
          }
        }
      }

      // Create the sale record
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

      // Create sale items
      for (const itemData of saleItemsData) {
        db.insert(saleItems)
          .values({
            saleId: created.id,
            ...itemData,
          })
          .run();
      }

      // Create stock movements with actual sale ID
      for (const movement of stockMovementsData) {
        db.insert(stockMovements)
          .values({
            ...movement,
            reference: created.id,
          })
          .run();
      }

      return created;
    })();
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
    return await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, saleId));
  }

  // Cash Sessions
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
      // 1. Create the session
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

      // 2. Update stock levels (will throw if insufficient)
      this.updateStockForSession(session.id, sessionData.inventory, "OPENING");

      // 3. Create inventory snapshots
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
    snapshots: { ingredientId: string; quantity: string }[],
    type: "OPENING" | "CLOSING"
  ): Promise<void> {
    console.log("Creating inventory snapshots:", {
      sessionId,
      type,
      snapshots,
    });

    const snapshotData = snapshots.map((s) => ({
      sessionId,
      ingredientId: s.ingredientId,
      quantity: toNum(s.quantity),
      type,
    }));

    console.log("Prepared snapshot data:", snapshotData);

    if (snapshotData.length > 0) {
      const result = await db
        .insert(sessionInventorySnapshots)
        .values(snapshotData)
        .returning();
      console.log("Created snapshots:", result);
    } else {
      console.log("No snapshots to create");
    }
  }

  // Session stock management
  async updateStockForSession(
    sessionId: string,
    snapshots: { ingredientId: string; quantity: string }[],
    type: "OPENING" | "CLOSING"
  ): Promise<void> {
    const updateStockForSessionTransaction = db.transaction((tx) => {
      for (const snapshot of snapshots) {
        const quantity = toNum(snapshot.quantity);
        if (quantity === 0) continue;

        const isOpening = type === "OPENING";
        const movementQuantity = isOpening ? -quantity : quantity;

        if (isOpening) {
          // Consume inventory via FIFO for session opening
          const lots = tx
            .select()
            .from(inventoryLots)
            .where(eq(inventoryLots.ingredientId, snapshot.ingredientId))
            .orderBy(asc(inventoryLots.purchasedAt))
            .all();

          const totalAvailable = lots.reduce(
            (sum, lot) => sum + lot.quantity,
            0
          );
          if (totalAvailable < quantity) {
            throw new Error(
              `Insufficient inventory to open session. Available: ${totalAvailable}, Required: ${quantity}`
            );
          }

          let remaining = quantity;
          for (const lot of lots) {
            if (remaining <= 0) break;
            const lotQuantity = lot.quantity;
            const consumed = Math.min(remaining, lotQuantity);

            tx.update(inventoryLots)
              .set({
                quantity: lotQuantity - consumed,
              })
              .where(eq(inventoryLots.id, lot.id))
              .run();

            remaining -= consumed;
          }
        } else {
          // Add inventory back for session closing
          tx.insert(inventoryLots)
            .values({
              ingredientId: snapshot.ingredientId,
              quantity,
              unitCost: 0, // Returned items have no new cost
              purchasedAt: new Date(),
            })
            .run();
        }

        // Create stock movement record
        tx.insert(stockMovements)
          .values({
            kind: isOpening ? "SESSION_OUT" : "SESSION_IN",
            ingredientId: snapshot.ingredientId,
            quantity: movementQuantity,
            reference: sessionId,
          })
          .run();
      }
    });

    updateStockForSessionTransaction();
  }

  // Expenses
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

  // Reports (convert numbers to strings for compatibility)
  async getCurrentStock(): Promise<
    {
      ingredientId: string;
      ingredientName: string;
      totalQuantity: string;
      unit: string;
      lowStockLevel: string | null;
    }[]
  > {
    const result = await db
      .select({
        ingredientId: ingredients.id,
        ingredientName: ingredients.name,
        totalQuantity: sum(inventoryLots.quantity),
        unit: ingredients.unit,
        lowStockLevel: ingredients.lowStockLevel,
      })
      .from(ingredients)
      .leftJoin(inventoryLots, eq(ingredients.id, inventoryLots.ingredientId))
      .groupBy(
        ingredients.id,
        ingredients.name,
        ingredients.unit,
        ingredients.lowStockLevel
      )
      .orderBy(asc(ingredients.name));

    return result.map((row) => ({
      ...row,
      totalQuantity: toStr(toNum(row.totalQuantity)),
      lowStockLevel: row.lowStockLevel ? toStr(toNum(row.lowStockLevel)) : null,
    }));
  }

  async getLowStockIngredients(): Promise<
    {
      ingredientId: string;
      ingredientName: string;
      totalQuantity: string;
      unit: string;
      lowStockLevel: string;
    }[]
  > {
    const result = await db
      .select({
        ingredientId: inventoryLots.ingredientId,
        ingredientName: ingredients.name,
        totalQuantity: sum(inventoryLots.quantity),
        unit: ingredients.unit,
        lowStockLevel: ingredients.lowStockLevel,
      })
      .from(inventoryLots)
      .innerJoin(ingredients, eq(inventoryLots.ingredientId, ingredients.id))
      .where(sql`${ingredients.lowStockLevel} IS NOT NULL`)
      .groupBy(
        inventoryLots.ingredientId,
        ingredients.name,
        ingredients.unit,
        ingredients.lowStockLevel
      )
      .having(
        sql`SUM(${inventoryLots.quantity}) < ${ingredients.lowStockLevel}`
      );

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
    console.log("Getting KPIs for range:", {
      start: start.toISOString(),
      end: end.toISOString(),
      startUnix: Math.floor(start.getTime() / 1000),
      endUnix: Math.floor(end.getTime() / 1000),
    });

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
    const grossMargin = revenue - cogs;

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
      productId: string;
      productName: string;
      sku: string;
      totalQty: number;
      totalRevenue: string;
    }[]
  > {
    console.log("Getting top products for range:", {
      from: from.toISOString(),
      to: to.toISOString(),
      fromUnix: Math.floor(from.getTime() / 1000),
      toUnix: Math.floor(to.getTime() / 1000),
    });

    const result = await db
      .select({
        productId: saleItems.productId,
        productName: products.name,
        sku: products.sku,
        totalQty: sum(saleItems.qty),
        totalRevenue: sum(saleItems.lineTotal),
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(products, eq(saleItems.productId, products.id))
      .where(
        and(
          sql`${sales.createdAt} >= ${Math.floor(from.getTime() / 1000)}`,
          sql`${sales.createdAt} <= ${Math.floor(to.getTime() / 1000)}`
        )
      )
      .groupBy(saleItems.productId, products.name, products.sku)
      .orderBy(desc(sum(saleItems.lineTotal)));

    return result.map((row) => ({
      ...row,
      totalQty: Number(row.totalQty || 0),
      totalRevenue: toStr(toNum(row.totalRevenue || 0)),
    }));
  }

  async getRecentActivity(limit: number): Promise<any[]> {
    const half = Math.max(1, Math.floor(limit / 2));

    // Get recent sales
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

    // Get recent expenses
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

    // Combine and sort
    const combined = [...recentSales, ...recentExpenses]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return combined.map((item) => ({
      ...item,
      amount: toStr(item.amount),
    }));
  }
  async getPendingOrders(): Promise<
    { sale: Sale; items: (SaleItem & { productName: string })[] }[]
  > {
    const pendingItems = await db
      .select({
        ...saleItems,
        productName: products.name,
      })
      .from(saleItems)
      .innerJoin(products, eq(saleItems.productId, products.id))
      .where(ne(saleItems.status, "DONE"));
    const saleIds = [...new Set(pendingItems.map((i) => i.saleId))];
    const pendingSales = await db
      .select()
      .from(sales)
      .where(inArray(sales.id, saleIds));
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
