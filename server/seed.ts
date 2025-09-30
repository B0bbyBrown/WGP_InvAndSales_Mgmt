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

    // Create sample ingredients
    const ingredientsToSeed = [
      { name: "Pizza Dough", unit: "g", lowStockLevel: 1000 },
      { name: "Tomato Sauce", unit: "ml", lowStockLevel: 500 },
      { name: "Mozzarella Cheese", unit: "g", lowStockLevel: 1000 },
      { name: "Pepperoni", unit: "g", lowStockLevel: 500 },
      { name: "Basil", unit: "g", lowStockLevel: 500 },
      { name: "Coca-Cola", unit: "ml", lowStockLevel: 1000 },
    ];

    const seededIngredients = [];
    for (const ingredientData of ingredientsToSeed) {
      let ingredient = await storage.getIngredientByName(ingredientData.name);
      if (!ingredient) {
        ingredient = await storage.createIngredient(ingredientData);
      }
      seededIngredients.push(ingredient);
    }

    // Add initial stock for each ingredient
    for (const ingredient of seededIngredients) {
      // We use adjustStock here because it correctly creates an inventory lot and a stock movement.
      // We'll add a large amount (20kg or 20L) to ensure there's plenty for testing.
      await storage.adjustStock({
        ingredientId: ingredient.id,
        quantity: "20000",
        note: "Initial stock seeding",
      });
    }

    const seededProduct = await storage.getProducts();

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
      // Upsert product
      let product = seededProduct.find((prod) => prod.sku === p.sku);
      if (!product) {
        product = await storage.createProduct({
          name: p.name,
          sku: p.sku,
          price: p.price,
        });
      }

      if (p.recipe.length > 0) {
        // Clear existing recipe items
        await storage.deleteRecipeItems(product.id);
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
