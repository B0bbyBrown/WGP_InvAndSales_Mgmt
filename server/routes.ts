import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertIngredientSchema,
  insertSupplierSchema,
  insertProductSchema,
  newPurchaseSchema,
  newSaleSchema,
  stockAdjustmentSchema,
  insertCashSessionSchema,
  insertExpenseSchema,
  insertRecipeItemSchema,
  openSessionSchema,
  closeSessionSchema,
  insertUserSchema,
} from "@shared/schema";
import session from "express-session";
import bcrypt from "bcryptjs";

// Helper to get the default admin user ID
async function getAdminUserId() {
  const adminUser = await storage.getUserByEmail("admin@pizzatruck.com");
  if (!adminUser) {
    throw new Error("Default admin user not found. Please seed the database.");
  }
  return adminUser.id;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session Middleware (add this before routes)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      }, // 24 hours
    })
  );

  // Auth Middleware (to protect routes)
  const authMiddleware = (requiredRole?: string) => (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (
      requiredRole &&
      req.session.role !== requiredRole &&
      req.session.role !== "DEV"
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await storage.loginUser(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", authMiddleware(), async (req, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  });

  // User Management (Admin only)
  app.post("/api/users", authMiddleware("ADMIN"), async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });
      // Return safe user object (without password)
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  app.get("/api/users", authMiddleware("ADMIN"), async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  // Protect sensitive routes (e.g., admin-only)
  app.use("/api/products", authMiddleware("ADMIN")); // Example: Protect product management

  // Ingredients
  app.get("/api/ingredients", async (req, res) => {
    try {
      console.log("📝 Fetching ingredients from SQLite...");
      const ingredients = await storage.getIngredients();
      console.log(`✅ Found ${ingredients.length} ingredients`);
      res.json(ingredients);
    } catch (error) {
      console.error("❌ Failed to fetch ingredients:", error);
      res.status(500).json({ error: "Failed to fetch ingredients" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const data = insertIngredientSchema.parse(req.body);
      const ingredient = await storage.createIngredient(data);
      res.json(ingredient);
    } catch (error) {
      res.status(400).json({ error: "Invalid ingredient data" });
    }
  });

  // Suppliers
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(data);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      console.log(
        "Creating product with data:",
        JSON.stringify(req.body, null, 2)
      );
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);

      if (data.recipe) {
        console.log("Creating recipe items:", data.recipe);
        for (const item of data.recipe) {
          await storage.createRecipeItem({
            productId: product.id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
          });
        }
      }

      console.log("Product created successfully:", product);
      res.json(product);
    } catch (error: any) {
      console.error("Failed to create product:", error);
      if (error.errors || error.issues) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors || error.issues,
        });
      } else {
        res.status(400).json({
          error: "Failed to create product",
          details: error.message || error,
        });
      }
    }
  });

  app.get("/api/products/:id/recipe", async (req, res) => {
    try {
      const recipeItems = await storage.getRecipeItems(req.params.id);
      res.json(recipeItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  // Purchases
  app.get("/api/purchases", async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchases" });
    }
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      const data = newPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(data);
      res.json(purchase);
    } catch (error) {
      res.status(400).json({ error: "Invalid purchase data" });
    }
  });

  // Stock management
  app.get("/api/stock/current", async (req, res) => {
    try {
      const stock = await storage.getCurrentStock();
      res.json(stock);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current stock" });
    }
  });

  app.get("/api/stock/low", async (req, res) => {
    try {
      const lowStock = await storage.getLowStockIngredients();
      res.json(lowStock);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  app.post("/api/stock/adjust", async (req, res) => {
    try {
      const data = stockAdjustmentSchema.parse(req.body);
      await storage.adjustStock(data);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Stock adjustment failed" });
    }
  });

  app.get("/api/stock/movements", async (req, res) => {
    try {
      const ingredientId = req.query.ingredientId as string;
      const movements = await storage.getStockMovements(ingredientId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });

  // Sales
  app.get("/api/sales", async (req, res) => {
    try {
      const from = req.query.from
        ? new Date(req.query.from as string)
        : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;
      const sales = await storage.getSales(from, to);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", async (req: any, res) => {
    try {
      const adminUserId = await getAdminUserId();
      const data = newSaleSchema.parse(req.body);
      const sale = await storage.createSale(data, adminUserId);
      res.json(sale);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Sale creation failed" });
    }
  });

  app.get("/api/sales/:id/items", async (req, res) => {
    try {
      const items = await storage.getSaleItems(req.params.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sale items" });
    }
  });

  // Cash sessions
  app.get("/api/sessions", async (req, res) => {
    try {
      console.log("📝 Fetching cash sessions from SQLite...");
      const sessions = await storage.getCashSessions();
      console.log(`✅ Found ${sessions.length} cash sessions`);
      res.json(sessions);
    } catch (error) {
      console.error("❌ Failed to fetch cash sessions:", error);
      res.status(500).json({ error: "Failed to fetch cash sessions" });
    }
  });

  app.get("/api/sessions/active", async (req, res) => {
    try {
      console.log("📝 Checking for active cash session in SQLite...");
      const session = await storage.getActiveCashSession();
      console.log(
        "✅ Active session status:",
        session ? "Found" : "None active"
      );
      res.json(session || null);
    } catch (error) {
      console.error("❌ Failed to fetch active session:", error);
      res.status(500).json({ error: "Failed to fetch active session" });
    }
  });

  app.post("/api/sessions/open", async (req: any, res) => {
    try {
      const adminUserId = await getAdminUserId();
      console.log(
        "Opening session with body:",
        JSON.stringify(req.body, null, 2)
      );

      // Check for active session
      const activeSession = await storage.getActiveCashSession();
      if (activeSession) {
        return res.status(400).json({
          error: "Cannot open a new session while another session is active",
        });
      }

      const body = openSessionSchema.parse(req.body);
      console.log("Parsed session data:", body);

      const session = await storage.openSessionAndMoveStock(body, adminUserId);

      console.log("Session created and stock updated successfully:", session);

      res.json(session);
    } catch (error) {
      console.error("Failed to open cash session:", error);
      if (error.errors || error.issues) {
        // Zod validation error
        res.status(400).json({
          error: "Validation failed",
          details: error.errors || error.issues,
        });
      } else {
        res.status(400).json({
          error: "Failed to open cash session",
          details: error.message || error,
        });
      }
    }
  });

  app.post("/api/sessions/:id/close", async (req: any, res) => {
    try {
      const adminUserId = await getAdminUserId();
      const body = closeSessionSchema.parse(req.body);

      const session = await storage.closeCashSession(
        req.params.id,
        body.closingFloat,
        body.notes,
        adminUserId
      );

      await storage.updateStockForSession(
        session.id,
        body.inventory,
        "CLOSING"
      );
      await storage.createInventorySnapshots(
        session.id,
        body.inventory,
        "CLOSING"
      );

      res.json(session);
    } catch (error) {
      console.error("Failed to close cash session:", error);
      res
        .status(400)
        .json({ error: "Failed to close cash session", details: error });
    }
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(data);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid expense data" });
    }
  });

  // Reports
  app.get("/api/reports/overview", async (req, res) => {
    try {
      const kpis = await storage.getTodayKPIs();
      res.json(kpis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch overview" });
    }
  });

  app.get("/api/reports/top-products", async (req, res) => {
    try {
      const from = req.query.from
        ? new Date(req.query.from as string)
        : new Date();
      const to = req.query.to ? new Date(req.query.to as string) : new Date();

      if (!req.query.from && !req.query.to) {
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
      }

      const topProducts = await storage.getTopProducts(from, to);
      res.json(topProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top products" });
    }
  });

  app.get("/api/reports/activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
