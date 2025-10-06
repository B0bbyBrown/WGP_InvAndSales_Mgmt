// Import necessary components and hooks
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  PlusCircle,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Coins,
  Utensils,
  BarChart3,
  Weight,
} from "lucide-react";

const taskIcons = {
  "add-product": <PlusCircle className="mr-2 h-5 w-5 text-blue-500" />,
  "change-ingredient": <Weight className="mr-2 h-5 w-5 text-yellow-500" />,
  "process-sale": <ShoppingCart className="mr-2 h-5 w-5 text-green-500" />,
  "add-expense": <Receipt className="mr-2 h-5 w-5 text-red-500" />,
  "manage-users": <Users className="mr-2 h-5 w-5 text-indigo-500" />,
  "open-close-session": <Coins className="mr-2 h-5 w-5 text-purple-500" />,
  "prep-kitchen-order": <Utensils className="mr-2 h-5 w-5 text-orange-500" />,
  "update-inventory": <Package className="mr-2 h-5 w-5 text-teal-500" />,
  "view-reports": <BarChart3 className="mr-2 h-5 w-5 text-pink-500" />,
};

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
  {
    id: "add-expense",
    title: "Add an Expense",
    description: "Record non-ingredient costs like utilities or maintenance.",
    roles: ["ADMIN"],
    redirect: "/expenses",
    steps: [
      "Go to Expenses page.",
      "Click 'Add Expense'.",
      "Enter description, amount, category, and date.",
      "Save – it updates financial reports.",
    ],
    logic:
      "Inserts into expenses table; affects profit calculations in reports.",
    screenshot: "/assets/help/add-expense.png",
  },
  {
    id: "manage-users",
    title: "Manage Users",
    description: "Add, edit, or remove team members.",
    roles: ["ADMIN"],
    redirect: "/users",
    steps: [
      "Go to Users page.",
      "To add: Fill form with email, password, name, role.",
      "To edit/delete: Use icons next to existing users.",
      "Save changes.",
    ],
    logic:
      "Modifies users table with role-based access; uses secure password hashing.",
    screenshot: "/assets/help/manage-users.png",
  },
  {
    id: "open-close-session",
    title: "Open or Close a Session",
    description: "Start/end a shift with cash and inventory tracking.",
    roles: ["ADMIN", "CASHIER"],
    redirect: "/sessions",
    steps: [
      "Go to Sessions page.",
      "To open: Enter starting cash and note inventory.",
      "To close: Enter ending cash, reconcile, and save.",
      "Required before sales.",
    ],
    logic:
      "Creates/updates sessions table; enables sales and tracks discrepancies.",
    screenshot: "/assets/help/open-close-session.png",
  },
  {
    id: "prep-kitchen-order",
    title: "Prep a Kitchen Order",
    description: "Update order statuses during preparation.",
    roles: ["KITCHEN"],
    redirect: "/kitchen",
    steps: [
      "Go to Kitchen page.",
      "View pending orders.",
      "Update status (e.g., from 'Pending' to 'Prepping' to 'Done').",
      "Save – deducts inventory automatically.",
    ],
    logic:
      "Updates order statuses linked to sales; consumes inventory via recipe_items and FIFO.",
    screenshot: "/assets/help/prep-kitchen-order.png",
  },
  {
    id: "update-inventory",
    title: "Update Inventory",
    description: "Adjust stock levels for ingredients.",
    roles: ["ADMIN", "CASHIER", "KITCHEN"],
    redirect: "/inventory",
    steps: [
      "Go to Inventory page.",
      "Select an ingredient.",
      "Adjust quantity (e.g., for wastage or manual update).",
      "Save – logs the movement.",
    ],
    logic:
      "Modifies inventory_lots with FIFO tracking; logs in stock_movements for audit.",
    screenshot: "/assets/help/update-inventory.png",
  },
  {
    id: "view-reports",
    title: "View Reports",
    description: "Generate summaries of sales, profits, and expenses.",
    roles: ["ADMIN"],
    redirect: "/reports",
    steps: [
      "Go to Reports page.",
      "Select report type (e.g., sales by date).",
      "Apply filters if needed.",
      "View charts and data.",
    ],
    logic:
      "Queries multiple tables (sales, expenses, etc.) for aggregated insights.",
    screenshot: "/assets/help/view-reports.png",
  },
];

// Nested grouping: role -> route -> task IDs
const roleGroups = {
  ADMIN: {
    "/inventory": ["change-ingredient", "update-inventory"],
    "/products": ["add-product"],
    "/expenses": ["add-expense"],
    "/users": ["manage-users"],
    "/reports": ["view-reports"],
    "/sessions": ["open-close-session"],
    "/sales": ["process-sale"],
  },
  CASHIER: {
    "/sessions": ["open-close-session"],
    "/sales": ["process-sale"],
    "/inventory": ["update-inventory"],
  },
  KITCHEN: {
    "/kitchen": ["prep-kitchen-order"],
    "/inventory": ["update-inventory"],
  },
};

export default function Help() {
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation(); // wouter's navigation

  // In the component, create filtered groups
  const filteredRoleGroups = Object.entries(roleGroups).reduce(
    (acc, [roleName, routeMap]) => {
      if (!user || roleName !== user.role) return acc; // Only show the current user's role group

      const filteredRoutes = Object.entries(routeMap).reduce(
        (routeAcc, [route, taskIds]) => {
          const routeTasks = tasks.filter(
            (task) =>
              taskIds.includes(task.id) &&
              task.title.toLowerCase().includes(search.toLowerCase())
          );
          if (routeTasks.length > 0) {
            routeAcc[route] = routeTasks;
          }
          return routeAcc;
        },
        {}
      );

      if (Object.keys(filteredRoutes).length > 0) {
        acc[roleName] = filteredRoutes;
      }
      return acc;
    },
    {}
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
      {Object.entries(filteredRoleGroups).length > 0 ? (
        Object.entries(filteredRoleGroups).map(([roleName, routeMap]) => (
          <div key={roleName} className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{roleName} Tasks</h2>
            {Object.entries(routeMap).map(([route, routeTasks]) => (
              <div key={route} className="mb-6">
                <h3 className="text-xl font-semibold mb-2">
                  {route.replace("/", "").charAt(0).toUpperCase() +
                    route.replace("/", "").slice(1)}{" "}
                  Page
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {routeTasks.map((task) => (
                    <AccordionItem
                      key={task.id}
                      value={task.id}
                      className="border-b last:border-b-0"
                    >
                      <AccordionTrigger className="flex items-center">
                        {taskIcons[task.id]}
                        {task.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p>{task.description}</p>
                        <Button
                          onClick={() => handleTaskClick(task.redirect)}
                          className="mt-2"
                        >
                          Go to Task
                        </Button>
                        {task.steps && (
                          <div className="mt-4">
                            <h4 className="text-lg font-semibold mb-2">
                              Steps:
                            </h4>
                            <ul className="list-disc list-inside">
                              {task.steps.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {task.logic && (
                          <div className="mt-4">
                            <h4 className="text-lg font-semibold mb-2">
                              Logic:
                            </h4>
                            <p>{task.logic}</p>
                          </div>
                        )}
                        {task.screenshot && (
                          <div className="mt-4">
                            <h4 className="text-lg font-semibold mb-2">
                              Screenshot:
                            </h4>
                            <img
                              src={task.screenshot}
                              alt={task.title}
                              className="max-w-sm h-auto"
                            />
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>No tasks match your search or role.</p>
      )}
    </div>
  );
}
