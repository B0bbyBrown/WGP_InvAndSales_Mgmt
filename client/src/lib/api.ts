export async function apiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include", // For sessions/cookies
    body: data ? JSON.stringify(data) : undefined,
  };

  const response = await fetch(`http://localhost:5082${url}`, options); // Adjust base URL if needed

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

import {
  NewPurchase,
  NewSale,
  StockAdjustment,
  OpenSessionRequest,
  CloseSessionRequest,
} from "@shared/schema";

// Ingredients
export const getIngredients = () => apiRequest("GET", "/api/ingredients");
export const createIngredient = (data: any) =>
  apiRequest("POST", "/api/ingredients", data);

// Suppliers
export const getSuppliers = () => apiRequest("GET", "/api/suppliers");
export const createSupplier = (data: any) =>
  apiRequest("POST", "/api/suppliers", data);

// Products
export const getProducts = () => apiRequest("GET", "/api/products");
export const createProduct = (data: any) =>
  apiRequest("POST", "/api/products", data);
export const getProductRecipe = (productId: string) =>
  apiRequest("GET", `/api/products/${productId}/recipe`);

// Purchases
export const getPurchases = () => apiRequest("GET", "/api/purchases");
export const createPurchase = (data: NewPurchase) =>
  apiRequest("POST", "/api/purchases", data);

// Stock
export const getCurrentStock = () => apiRequest("GET", "/api/stock/current");
export const getLowStock = () => apiRequest("GET", "/api/stock/low");
export const adjustStock = (data: StockAdjustment) =>
  apiRequest("POST", "/api/stock/adjust", data);
export const getStockMovements = (ingredientId?: string) =>
  apiRequest(
    "GET",
    `/api/stock/movements${ingredientId ? `?ingredientId=${ingredientId}` : ""}`
  );

// Sales
export const getSales = (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return apiRequest("GET", `/api/sales?${params.toString()}`);
};
export const createSale = (data: NewSale) =>
  apiRequest("POST", "/api/sales", data);
export const getSaleItems = (saleId: string) =>
  apiRequest("GET", `/api/sales/${saleId}/items`);

// Cash Sessions
export const getCashSessions = () => apiRequest("GET", "/api/sessions");
export const getActiveCashSession = () =>
  apiRequest("GET", "/api/sessions/active");
export const getCurrentUser = async () => {
  try {
    const response = await apiRequest("/api/auth/me");
    return response.user;
  } catch (error) {
    if (error.status === 401) {
      return null;
    }
    throw error;
  }
};
export const login = (data: { email: string; password: string }) =>
  apiRequest("POST", "/api/auth/login", data);
export const getUsers = () => apiRequest("GET", "/api/users");
export const createUser = (data: {
  email: string;
  password: string;
  name: string;
  role: string;
}) => apiRequest("POST", "/api/users", data);
export const openCashSession = (data: OpenSessionRequest) => {
  console.log("Opening session with data:", JSON.stringify(data, null, 2));
  return apiRequest("POST", "/api/sessions/open", data);
};
export const closeCashSession = (
  sessionId: string,
  data: CloseSessionRequest
) => apiRequest("POST", `/api/sessions/${sessionId}/close`, data);

// Expenses
export const getExpenses = () => apiRequest("GET", "/api/expenses");
export const createExpense = (data: any) =>
  apiRequest("POST", "/api/expenses", data);

// Reports
export const getOverview = () => apiRequest("GET", "/api/reports/overview");
export const getTopProducts = (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return apiRequest("GET", `/api/reports/top-products?${params.toString()}`);
};
export const getRecentActivity = (limit: number = 10) =>
  apiRequest("GET", `/api/reports/activity?limit=${limit}`);
