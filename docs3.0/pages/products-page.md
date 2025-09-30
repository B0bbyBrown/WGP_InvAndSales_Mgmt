# Products Page (`/products`) Data Flow Analysis

This document analyzes how the Products page handles the creation and display of products and their associated ingredient recipes.

---

### 1. Displaying Products

- **UI Component**: The main product table in `client/src/pages/products.tsx`.
- **Frontend API Call**: Uses `useQuery` to call `getProducts()` from `@/lib/api`.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to `/api/products`.
- **Backend Route (`server/routes.ts`)**: Calls the `storage.getProducts()` method.
- **Backend Logic (`server/sqlite-storage.ts`)**: Selects and returns all records from the `products` table.
- **Conclusion**: **Connected and working correctly.**

---

### 2. Creating a New Product (with Recipe)

This is the most critical workflow on this page, as it links sales items to inventory consumption.

- **UI Component**: The "Create Product" button and its dialog, which includes fields for product details and a dynamic list for recipe items (ingredient and quantity).
- **Frontend API Call**: On submission, it constructs a single payload containing the product details and a `recipe` array. This payload is sent to the `createProduct` mutation.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `POST` request to `/api/products` with the combined product and recipe data.
- **Backend Route (`server/routes.ts`)**: The server handles this transactionally. It first calls `storage.createProduct()` to create the product record. Then, it iterates through the `recipe` array from the request body, calling `storage.createRecipeItem()` for each item to link the product to its ingredients.
- **Backend Logic (`server/sqlite-storage.ts`)**: The `createProduct` method inserts a new row into the `products` table, and the `createRecipeItem` method inserts new rows into the `recipe_items` table, creating the many-to-many relationship.
- **Conclusion**: **Connected and working correctly.** The logic correctly handles the creation of both the product and its associated recipe in a single operation.

---

### 3. Viewing a Product's Recipe

- **UI Component**: Clicking the "View Recipe" icon on a product row.
- **Frontend API Call**: Triggers a `useQuery` that calls `getProductRecipe(productId)`.
- **API Wrapper (`@/lib/api.ts`)**: Makes a `GET` request to `/api/products/:id/recipe`.
- **Backend Route (`server/routes.ts`)**: Calls the `storage.getRecipeItems(productId)` method.
- **Backend Logic (`server/sqlite-storage.ts`)**: Selects all records from the `recipe_items` table that match the given `productId`.
- **Conclusion**: **Connected and working correctly.**
