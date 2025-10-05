// Import necessary components and hooks
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter"; // wouter's navigation

// Define task data (expand this array with more tasks)
const tasks = [
  {
    id: "add-product",
    title: "Add a New Product",
    description: "Create a menu item with price and recipe.",
    roles: ["ADMIN", "KITCHEN"],
    redirect: "/products",
    steps: [
      "Go to Products page.",
      'Click "Add Product".',
      "Fill in name, SKU, price, and recipe items.",
      "Save – it links to inventory.",
    ],
    logic:
      "This adds to the products table and recipes link ingredients for automatic stock deduction (FIFO: oldest first).",
    screenshot: "/assets/help/add-product.png", // Placeholder
  },
  {
    id: "change-ingredient",
    title: "Change Ingredient Measurement/Weight",
    description:
      "Update quantity or unit for an ingredient in inventory or recipes.",
    roles: ["ADMIN", "KITCHEN"],
    redirect: "/inventory", // Or /products for recipes
    steps: [
      "Go to Inventory (or Products for recipes).",
      "Select ingredient.",
      "Edit quantity/unit.",
      "Save – updates stock levels.",
    ],
    logic:
      "Adjusts inventory_lots table; uses Drizzle ORM for validation and FIFO for cost tracking.",
    screenshot: "/assets/help/change-ingredient.png",
  },
  // Add more tasks here, e.g., 'Process Sale', 'Open Session', etc.
  // Example:
  {
    id: "process-sale",
    title: "Process a Sale",
    description: "Ring up customer orders.",
    roles: ["ADMIN", "CASHIER"],
    redirect: "/sales",
    steps: ["Add items to cart.", "Select payment.", "Complete sale."],
    logic: "Deducts stock via recipe_items and FIFO, updates sales table.",
    screenshot: "/assets/help/process-sale.png",
  },
];

export default function Help() {
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation(); // wouter's navigation

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(search.toLowerCase()) &&
      task.roles.includes(user?.role)
  );

  const handleTaskClick = (redirect) => {
    setLocation(redirect);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Quick Task Helper</h1>
      <Input
        placeholder="Search tasks (e.g., add product)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="p-4">
            <h2 className="text-xl font-semibold">{task.title}</h2>
            <p>{task.description}</p>
            <Button
              onClick={() => handleTaskClick(task.redirect)}
              className="mt-2"
            >
              Go to Task
            </Button>
            {/* Add modal trigger here for steps/logic/screenshot */}
          </Card>
        ))}
      </div>
      {filteredTasks.length === 0 && <p>No tasks match your search or role.</p>}
    </div>
  );
}
