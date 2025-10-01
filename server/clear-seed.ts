import { db } from "./db";

import {
  ingredients,
  products,
  recipeItems,
  inventoryLots,
  stockMovements,
  purchaseItems,
  saleItems,
} from "@shared/schema";

async function clearSeed() {
  await db.delete(recipeItems);
  await db.delete(inventoryLots);
  await db.delete(stockMovements);
  await db.delete(purchaseItems);
  await db.delete(saleItems);
  await db.delete(products);
  await db.delete(ingredients);
  console.log("Cleared seeded data for ingredients and products");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  clearSeed();
}
