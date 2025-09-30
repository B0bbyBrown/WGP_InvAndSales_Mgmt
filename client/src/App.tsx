import { Switch, Route, useLocation, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Products from "@/pages/products";
import Purchases from "@/pages/purchases";
import Sales from "@/pages/sales";
import Sessions from "@/pages/sessions";
import Expenses from "@/pages/expenses";
import Reports from "@/pages/reports";
import Users from "@/pages/Users";
import Login from "@/pages/Login";
import { createContext, useState, useEffect, useContext } from "react";
import { getCurrentUser } from "@/lib/api"; // Assume this calls /api/auth/me

export const AuthContext = createContext({ user: null, loading: true });

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, loading }}>
        <TooltipProvider>
          <Router>
            <Switch>
              <Route path="/login" component={Login} />
              <ProtectedRoute
                path="/"
                component={Dashboard}
                requiredRole="ANY"
              />
              <ProtectedRoute
                path="/inventory"
                component={Inventory}
                requiredRole="ANY"
              />
              <ProtectedRoute
                path="/products"
                component={Products}
                requiredRole="ANY"
              />
              <ProtectedRoute
                path="/purchases"
                component={Purchases}
                requiredRole="ANY"
              />
              <ProtectedRoute
                path="/sales"
                component={Sales}
                requiredRole="ANY"
              />
              <ProtectedRoute
                path="/sessions"
                component={Sessions}
                requiredRole="CASHIER"
              />
              <ProtectedRoute
                path="/expenses"
                component={Expenses}
                requiredRole="ANY"
              />
              <ProtectedRoute
                path="/reports"
                component={Reports}
                requiredRole="ANY"
              />
              <ProtectedRoute
                path="/users"
                component={Users}
                requiredRole="ADMIN"
              />
              <Route component={NotFound} />
            </Switch>
          </Router>
        </TooltipProvider>
        <Toaster />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

const ProtectedRoute = ({ path, component: Component, requiredRole }) => {
  const { user } = useContext(AuthContext);
  const [location, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }
  if (
    requiredRole !== "ANY" &&
    user.role !== requiredRole &&
    user.role !== "ADMIN"
  ) {
    setLocation("/");
    return null;
  }
  return <Route path={path} component={Component} />;
};

export default App;
