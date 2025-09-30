import { Link, useLocation } from "wouter";
import {
  ShoppingCart,
  Package,
  Utensils,
  DollarSign,
  Coins,
  Receipt,
  BarChart3,
  PizzaIcon,
  User,
  Bell,
  RefreshCw,
  Plus,
  ScanBarcode,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getActiveCashSession, getLowStock } from "@/lib/api";
import { useContext } from "react";
import { AuthContext } from "../App"; // Adjust path if needed
import { apiRequest } from "../lib/api";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function Layout({ children, title, description }: LayoutProps) {
  const { user } = useContext(AuthContext);
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    setLocation("/login");
  };

  const { data: activeSession } = useQuery({
    queryKey: ["/api/sessions/active"],
    queryFn: () => getActiveCashSession(),
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/stock/low"],
    queryFn: () => getLowStock(),
  });

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3, active: location === "/" },
    {
      name: "Inventory",
      href: "/inventory",
      icon: Package,
      active: location === "/inventory",
      badge: lowStockItems.length > 0 ? lowStockItems.length : undefined,
    },
    {
      name: "Products & Recipes",
      href: "/products",
      icon: Utensils,
      active: location === "/products",
    },
    {
      name: "Purchases",
      href: "/purchases",
      icon: ShoppingCart,
      active: location === "/purchases",
    },
    {
      name: "Point of Sale",
      href: "/sales",
      icon: ScanBarcode,
      active: location === "/sales",
    },
    {
      name: "Cash Sessions",
      href: "/sessions",
      icon: Coins,
      active: location === "/sessions",
    },
    {
      name: "Expenses",
      href: "/expenses",
      icon: Receipt,
      active: location === "/expenses",
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      active: location === "/reports",
    },
  ];

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  return (
    <div
      className="flex min-h-screen bg-background"
      data-testid="layout-container"
    >
      {/* Sidebar */}
      <aside
        className="w-64 bg-card border-r border-border flex-shrink-0"
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="p-6 border-b border-border" data-testid="logo-section">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <PizzaIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1
                className="text-lg font-bold text-foreground"
                data-testid="app-title"
              >
                Pizza Truck Ops
              </h1>
              <p className="text-sm text-muted-foreground">Operations Hub</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div
          className="p-4 border-b border-border bg-muted/50"
          data-testid="user-profile"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" data-testid="user-name">
                {user?.name || "Guest"}
              </p>
              <Badge
                variant="secondary"
                className="text-xs"
                data-testid="user-role"
              >
                {user?.role || "GUEST"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4" data-testid="navigation">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.active
                      ? "sidebar-active"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                  data-testid={`nav-link-${item.name
                    .toLowerCase()
                    .replace(/ /g, "-")}`}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                  {item.badge && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Session Status */}
        <div
          className="mt-auto p-4 border-t border-border"
          data-testid="session-status"
        >
          {activeSession ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-800">
                    Session Open
                  </span>
                </div>
                <p
                  className="text-xs text-green-600 mt-1"
                  data-testid="session-start-time"
                >
                  Started: {formatTime(new Date(activeSession.openedAt))}
                </p>
                <p
                  className="text-xs text-green-600"
                  data-testid="session-float"
                >
                  Float: {formatCurrency(activeSession.openingFloat)}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-red-800">
                    No Active Session
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Open a session to begin sales
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden" data-testid="main-content">
        {/* Header */}
        <header
          className="bg-card border-b border-border p-6"
          data-testid="page-header"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-2xl font-bold text-foreground"
                data-testid="page-title"
              >
                {title}
              </h2>
              {description && (
                <p
                  className="text-muted-foreground"
                  data-testid="page-description"
                >
                  {description}
                </p>
              )}
            </div>
            <div
              className="flex items-center space-x-4"
              data-testid="header-actions"
            >
              <select
                className="px-3 py-1 border border-border rounded-md text-sm bg-background"
                data-testid="date-selector"
                aria-label="Date range selector"
              >
                <option>Today</option>
                <option>Yesterday</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
              <Button variant="default" size="sm" data-testid="refresh-button">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              {user && (
                <>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/users"
                      className="px-3 py-1 border border-border rounded-md text-sm bg-background"
                      data-testid="users-link"
                    >
                      Users
                    </Link>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div
          className="p-6 space-y-6 overflow-y-auto"
          data-testid="page-content"
        >
          {children}
        </div>
      </main>

      {/* Quick Actions */}
      <div
        className="fixed bottom-6 right-6 space-y-3"
        data-testid="quick-actions"
      >
        <Link href="/sales">
          <Button
            size="lg"
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl"
            title="Quick Sale"
            data-testid="quick-sale-button"
          >
            <ScanBarcode className="h-6 w-6" />
          </Button>
        </Link>
        <Button
          variant="secondary"
          size="sm"
          className="w-12 h-12 rounded-full shadow-md"
          title="Add Inventory"
          data-testid="add-inventory-button"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
