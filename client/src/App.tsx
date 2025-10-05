import { Switch, Route, useLocation, Router, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Items from "@/pages/items";
import Purchases from "@/pages/purchases";
import Sales from "@/pages/sales";
import Sessions from "@/pages/sessions";
import Expenses from "@/pages/expenses";
import Reports from "@/pages/reports";
import Users from "@/pages/Users";
import Login from "@/pages/Login";
import { useContext, useEffect } from "react";
import { getCurrentUser } from "@/lib/api"; // Assume this calls /api/auth/me
import { AuthContext } from "./contexts/AuthContext";
import Kitchen from "@/pages/kitchen"; // Assuming we'll create this file
import Help from "./pages/help.tsx";

function App() {
  const {
    data: user,
    isLoading,
    isSuccess,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
    retry: false,
  });

  const isAuthenticated = isSuccess && !!user;
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && location === "/login") {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, location, setLocation]);

  console.log("App authentication state:", {
    isLoading,
    isAuthenticated,
    user: user ? user.id : null,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, isAuthenticated }}>
      <TooltipProvider>
        <Router>
          <Switch>
            <Route path="/login">
              {isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
            </Route>
            <Redirect path="/" to="/dashboard" />
            <ProtectedRoute
              path="/dashboard"
              component={Dashboard}
              allowedRoles={["ADMIN", "CASHIER", "KITCHEN", "DEV"]}
            />
            <ProtectedRoute
              path="/items"
              component={Items}
              allowedRoles={["ADMIN", "DEV"]}
            />
            <ProtectedRoute
              path="/purchases"
              component={Purchases}
              allowedRoles={["ADMIN", "DEV"]}
            />
            <ProtectedRoute
              path="/sales"
              component={Sales}
              allowedRoles={["CASHIER", "DEV"]}
            />
            <ProtectedRoute
              path="/sessions"
              component={Sessions}
              allowedRoles={["CASHIER", "DEV"]}
            />
            <ProtectedRoute
              path="/expenses"
              component={Expenses}
              allowedRoles={["ADMIN", "DEV"]}
            />
            <ProtectedRoute
              path="/reports"
              component={Reports}
              allowedRoles={["ADMIN", "DEV"]}
            />
            <ProtectedRoute
              path="/users"
              component={Users}
              allowedRoles={["ADMIN", "DEV"]}
            />
            <ProtectedRoute
              path="/kitchen"
              component={Kitchen}
              allowedRoles={["KITCHEN", "DEV"]}
            />
            <Route path="/help" element={<Help />} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </TooltipProvider>
      <Toaster />
    </AuthContext.Provider>
  );
}

const ProtectedRoute = ({ path, component: Component, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  console.log(`ProtectedRoute for ${path}:`, {
    loading,
    isAuthenticated,
    userRole: user?.role,
  });

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    console.log(`Redirecting to /login from ${path} - not authenticated`);
    return <Redirect to="/login" />;
  }

  const userHasRequiredRole = user && allowedRoles.includes(user.role);

  if (!userHasRequiredRole) {
    console.log(`Redirecting from ${path} - insufficient role`);
    // If the user is authenticated but doesn't have the right role,
    // redirect them to a default page based on their role.
    if (user.role === "KITCHEN") {
      return <Redirect to="/kitchen" />;
    }
    return <Redirect to="/dashboard" />;
  }

  return <Route path={path} component={Component} />;
};

export default App;
