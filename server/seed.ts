import { storage } from "./storage";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function seed() {
  console.log("Starting seed process...");

  try {
    // Create admin user (idempotent) - this is the only required seed data
    const adminUser = await storage.getUserByEmail("admin@pizzatruck.com");
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("password", SALT_ROUNDS);
      await storage.createUser({
        email: "admin@pizzatruck.com",
        password: hashedPassword,
        name: "John Smith",
        role: "ADMIN",
      });
      console.log("Created admin user:", "admin@pizzatruck.com");
    }
    const secondAdminUser = await storage.getUserByEmail(
      "6obbybrown@gmail.com"
    );
    if (!secondAdminUser) {
      const hashedPassword = await bcrypt.hash("password", SALT_ROUNDS);
      await storage.createUser({
        email: "6obbybrown@gmail.com",
        password: hashedPassword,
        name: "Bobby Brown",
        role: "ADMIN",
      });
      console.log("Created admin user:", "6obbybrown@gmail.com");
    }

    // Create sample ingredients
    const seededIngredients = await Promise.all([
      storage.createIngredient({
        name: "Pizza Dough",
        unit: "g",
        lowStockLevel: 1000,
      }),
      storage.createIngredient({
        name: "Tomato Sauce",
        unit: "ml",
        lowStockLevel: 500,
      }),
      storage.createIngredient({
        name: "Mozzarella Cheese",
        unit: "g",
        lowStockLevel: 1000,
      }),
      storage.createIngredient({
        name: "Pepperoni",
        unit: "g",
        lowStockLevel: 500,
      }),
      storage.createIngredient({
        name: "Basil",
        unit: "g",
        lowStockLevel: 500,
      }),
      storage.createIngredient({
        name: "Coca-Cola",
        unit: "ml",
        lowStockLevel: 1000,
      }),
    ]);
    console.log(`Created ${seededIngredients.length} ingredients`);

    // Add initial stock for each ingredient
    console.log("Adding initial stock...");
    for (const ingredient of seededIngredients) {
      // We use adjustStock here because it correctly creates an inventory lot and a stock movement.
      // We'll add a large amount (20kg or 20L) to ensure there's plenty for testing.
      await storage.adjustStock({
        ingredientId: ingredient.id,
        quantity: "20000",
        note: "Initial stock seeding",
      });
    }
    console.log(
      `Added initial stock for ${seededIngredients.length} ingredients`
    );

    // Create sample products
    const productsToSeed = [
      {
        name: "Margherita Pizza",
        sku: "PIZ-MAR",
        price: 12.99,
        recipe: [
          { ingredientName: "Pizza Dough", quantity: 1 },
          { ingredientName: "Tomato Sauce", quantity: 150 },
          { ingredientName: "Mozzarella Cheese", quantity: 200 },
          { ingredientName: "Basil", quantity: 10 },
        ],
      },
      {
        name: "Pepperoni Pizza",
        sku: "PIZ-PEP",
        price: 14.99,
        recipe: [
          { ingredientName: "Pizza Dough", quantity: 1 },
          { ingredientName: "Tomato Sauce", quantity: 150 },
          { ingredientName: "Mozzarella Cheese", quantity: 150 },
          { ingredientName: "Pepperoni", quantity: 50 },
        ],
      },
      {
        name: "Coca-Cola",
        sku: "DRK-COKE",
        price: 2.5,
        recipe: [],
      },
    ];

    for (const p of productsToSeed) {
      const product = await storage.createProduct({
        name: p.name,
        sku: p.sku,
        price: p.price,
      });

      if (p.recipe.length > 0) {
        for (const rItem of p.recipe) {
          const ingredient = seededIngredients.find(
            (i) => i.name === rItem.ingredientName
          );
          if (ingredient) {
            await storage.createRecipeItem({
              productId: product.id,
              ingredientId: ingredient.id,
              quantity: rItem.quantity,
            });
          }
        }
      }
      console.log(`Created product: ${p.name}`);
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
