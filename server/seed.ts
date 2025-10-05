import { storage } from "./storage";
import { hashPassword } from "./lib/auth";

export async function seed() {
  console.log("Starting seed process...");

  try {
    // Create admin user (idempotent) - this is the only required seed data
    const adminUser = await storage.getUserByEmail("admin@pizzatruck.com");
    if (!adminUser) {
      const hashedPassword = hashPassword("password");
      await storage.createUser({
        email: "admin@pizzatruck.com",
        password: hashedPassword,
        name: "John Smith",
        role: "ADMIN",
      });
    }
    const secondAdminUser = await storage.getUserByEmail(
      "6obbybrown@gmail.com"
    );
    if (!secondAdminUser) {
      const hashedPassword = hashPassword("Bobby2004brown");
      await storage.createUser({
        email: "6obbybrown@gmail.com",
        password: hashedPassword,
        name: "Bobby Brown",
        role: "ADMIN",
      });
    }

    // Create cashier user
    const cashierUser = await storage.getUserByEmail("cashier@pizzatruck.com");
    if (!cashierUser) {
      const hashedPassword = hashPassword("password");
      await storage.createUser({
        email: "cashier@pizzatruck.com",
        password: hashedPassword,
        name: "Jane Doe",
        role: "CASHIER",
      });
    }

    // Create kitchen user
    const kitchenUser = await storage.getUserByEmail("kitchen@pizzatruck.com");
    if (!kitchenUser) {
      const hashedPassword = hashPassword("password");
      await storage.createUser({
        email: "kitchen@pizzatruck.com",
        password: hashedPassword,
        name: "Mike Chef",
        role: "KITCHEN",
      });
    }

    console.log("Seeding items and recipes...");

    // Seed Items
    const itemData = [
      // Raw Materials
      { name: "Flour", type: "RAW", unit: "kg", lowStockLevel: 10 },
      { name: "Yeast", type: "RAW", unit: "g", lowStockLevel: 100 },
      { name: "Water", type: "RAW", unit: "L", lowStockLevel: 20 },
      { name: "Salt", type: "RAW", unit: "kg", lowStockLevel: 1 },
      { name: "Tomato Sauce", type: "RAW", unit: "L", lowStockLevel: 5 },
      { name: "Mozzarella Cheese", type: "RAW", unit: "kg", lowStockLevel: 5 },
      { name: "Pepperoni", type: "RAW", unit: "kg", lowStockLevel: 2 },
      { name: "Canned Soda", type: "SELLABLE", unit: "can", lowStockLevel: 24, price: 2.5, sku: "DR-COKE" },

      // Manufactured Items (Sub-assemblies)
      { name: "Pizza Dough", type: "MANUFACTURED", unit: "ball", lowStockLevel: 10 },

      // Sellable Products
      { name: "Margherita Pizza", type: "SELLABLE", unit: "unit", price: 12.0, sku: "PIZ-MAR" },
      { name: "Pepperoni Pizza", type: "SELLABLE", unit: "unit", price: 14.0, sku: "PIZ-PEP" },
    ];

    const itemIds: { [key: string]: string } = {};
    for (const item of itemData) {
      let existing = await storage.getItemByName(item.name);
      if (existing) {
        itemIds[item.name] = existing.id;
        continue;
      }
      const newItem = await storage.createItem(item as any);
      itemIds[item.name] = newItem.id;
    }

    // Seed Recipes
    const recipeData = [
      {
        parent: "Pizza Dough",
        children: [
          { child: "Flour", quantity: 0.5 }, // 0.5 kg
          { child: "Yeast", quantity: 10 },   // 10 g
          { child: "Water", quantity: 0.3 }, // 0.3 L
          { child: "Salt", quantity: 0.01 },// 0.01 kg
        ],
      },
      {
        parent: "Margherita Pizza",
        children: [
          { child: "Pizza Dough", quantity: 1 },
          { child: "Tomato Sauce", quantity: 0.2 },
          { child: "Mozzarella Cheese", quantity: 0.15 },
        ],
      },
      {
        parent: "Pepperoni Pizza",
        children: [
          { child: "Pizza Dough", quantity: 1 },
          { child: "Tomato Sauce", quantity: 0.2 },
          { child: "Mozzarella Cheese", quantity: 0.15 },
          { child: "Pepperoni", quantity: 0.1 },
        ],
      },
    ];

    for (const recipe of recipeData) {
      const parentId = itemIds[recipe.parent];
      // Clear existing recipe items to ensure idempotency
      await storage.deleteRecipeItems(parentId);
      for (const child of recipe.children) {
        await storage.createRecipeItem({
          parentItemId: parentId,
          childItemId: itemIds[child.child],
          quantity: child.quantity,
        });
      }
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Seed process failed:", error);
    process.exit(1);
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}

// Create more suppliers
