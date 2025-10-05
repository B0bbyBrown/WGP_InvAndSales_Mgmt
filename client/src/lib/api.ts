export async function apiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include", // For sessions/cookies
    body: data ? JSON.stringify(data) : undefined,
  };

  const baseUrl =
    import.meta.env.MODE === "development"
      ? `${window.location.protocol}//${window.location.hostname}:5082`
      : window.location.origin;

  const response = await fetch(`${baseUrl}${url}`, options);

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
  NewItem,
} from "@shared/schema";

// Items
export const getItems = () => apiRequest("GET", "/api/items");
export const createItem = (data: NewItem) =>
  apiRequest("POST", "/api/items", data);
export const getItemRecipe = (itemId: string) =>
  apiRequest("GET", `/api/items/${itemId}/recipe`);

// Suppliers
export const getSuppliers = () => apiRequest("GET", "/api/suppliers");
export const createSupplier = async (data: {
  name: string;
  phone?: string;
  email?: string;
}) => {
  const response = await fetch("/api/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create supplier");
  return response.json();
};

// Purchases
export const getPurchases = () => apiRequest("GET", "/api/purchases");
export const createPurchase = (data: NewPurchase) =>
  apiRequest("POST", "/api/purchases", data);

// Stock
export const getCurrentStock = () => apiRequest("GET", "/api/stock/current");
export const getLowStock = () => apiRequest("GET", "/api/stock/low");
export const adjustStock = (data: StockAdjustment) =>
  apiRequest("POST", "/api/stock/adjust", data);
export const getStockMovements = (itemId?: string) =>
  apiRequest("GET", `/api/stock/movements${itemId ? `?itemId=${itemId}` : ""}`);

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
export const getPendingOrders = () => apiRequest("GET", "/api/kitchen/orders");
export const updateSaleItemStatus = (id: string, status: string) =>
  apiRequest("PATCH", `/api/sale-items/${id}/status`, { status });

export const getRawMaterials = () => apiRequest("GET", "/api/raw-materials");
export const createRawMaterial = (data: NewItem) =>
  apiRequest("POST", "/api/raw-materials", data);
