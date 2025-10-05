import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Percent,
  ShoppingBag,
  Calendar,
  Download,
  Filter,
  PizzaIcon,
  PillBottle,
  AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getOverview,
  getTopProducts,
  getLowStock,
  getSales,
  getStockMovements,
  getCurrentStock,
} from "@/lib/api";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";

export default function Reports() {
  const [dateRange, setDateRange] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    let from: Date, to: Date;

    switch (dateRange) {
      case "yesterday":
        from = new Date(now);
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setHours(23, 59, 59, 999);
        break;
      case "this_week":
        from = new Date(now);
        from.setDate(from.getDate() - now.getDay());
        from.setHours(0, 0, 0, 0);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;
      case "this_month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;
      case "custom":
        from = fromDate ? new Date(fromDate) : new Date(now);
        to = toDate ? new Date(toDate) : new Date(now);
        break;
      default: // today
        from = new Date(now);
        from.setHours(0, 0, 0, 0);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
    }

    return { from, to };
  };

  const { from, to } = getDateRange();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/reports/overview", dateRange, fromDate, toDate],
    queryFn: () => getOverview(),
  });

  const { data: topProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: [
      "/api/reports/top-products",
      from.toISOString(),
      to.toISOString(),
    ],
    queryFn: () =>
      getTopProducts(
        from.toISOString().split("T")[0],
        to.toISOString().split("T")[0]
      ),
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/stock/low"],
    queryFn: () => getLowStock(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["/api/sales", from.toISOString(), to.toISOString()],
    queryFn: () =>
      getSales(
        from.toISOString().split("T")[0],
        to.toISOString().split("T")[0]
      ),
  });

  const { data: stockMovements = [] } = useQuery({
    queryKey: ["/api/stock/movements"],
    queryFn: () => getStockMovements(),
  });

  const { data: currentStock = [] } = useQuery({
    queryKey: ["/api/stock/current"],
    queryFn: () => getCurrentStock(),
  });

  const formatPercentage = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  const getPeriodLabel = () => {
    switch (dateRange) {
      case "yesterday":
        return "Yesterday";
      case "this_week":
        return "This Week";
      case "this_month":
        return "This Month";
      case "custom":
        return `${formatDate(from)} - ${formatDate(to)}`;
      default:
        return "Today";
    }
  };

  // Calculate period metrics
  const periodRevenue = sales.reduce(
    (sum: number, sale: any) => sum + parseFloat(sale.total),
    0
  );
  const periodCogs = sales.reduce(
    (sum: number, sale: any) => sum + parseFloat(sale.cogs),
    0
  );
  const periodGrossMargin =
    periodRevenue > 0
      ? ((periodRevenue - periodCogs) / periodRevenue) * 100
      : 0;

  // Ingredient usage analysis
  const getIngredientUsage = () => {
    const consumptionMovements = stockMovements.filter(
      (movement: any) =>
        movement.kind === "SALE_CONSUME" &&
        new Date(movement.createdAt) >= from &&
        new Date(movement.createdAt) <= to
    );

    const usage = consumptionMovements.reduce((acc: any, movement: any) => {
      const ingredientId = movement.ingredientId;
      if (!acc[ingredientId]) {
        acc[ingredientId] = {
          ingredientId,
          totalUsed: 0,
          movementCount: 0,
        };
      }
      acc[ingredientId].totalUsed += Math.abs(parseFloat(movement.quantity));
      acc[ingredientId].movementCount += 1;
      return acc;
    }, {});

    return Object.values(usage).sort(
      (a: any, b: any) => b.totalUsed - a.totalUsed
    );
  };

  const ingredientUsage = getIngredientUsage();

  const getIngredientName = (ingredientId: string) => {
    const stockItem = currentStock.find(
      (item: any) => item.ingredientId === ingredientId
    );
    return stockItem?.ingredientName || "Unknown";
  };

  const getIngredientUnit = (ingredientId: string) => {
    const stockItem = currentStock.find(
      (item: any) => item.ingredientId === ingredientId
    );
    return stockItem?.unit || "";
  };

  return (
    <Layout
      title="Reports & Analytics"
      description="Detailed reports and business analytics"
    >
      {/* Date Range Filter */}
      <Card className="mb-6" data-testid="date-range-filter-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Report Period: {getPeriodLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="date-range-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div>
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    data-testid="from-date-input"
                  />
                </div>
                <div>
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    data-testid="to-date-input"
                  />
                </div>
              </>
            )}

            <Button variant="outline" data-testid="export-report-button">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        data-testid="financial-overview-cards"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Period Revenue
                </p>
                <p
                  className="text-2xl font-bold text-foreground"
                  data-testid="period-revenue"
                >
                  {formatCurrency(periodRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  {sales.length} transactions
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Period COGS
                </p>
                <p
                  className="text-2xl font-bold text-foreground"
                  data-testid="period-cogs"
                >
                  {formatCurrency(periodCogs)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodRevenue > 0
                    ? `${((periodCogs / periodRevenue) * 100).toFixed(
                        0
                      )}% of revenue`
                    : "0% of revenue"}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Gross Margin
                </p>
                <p
                  className="text-2xl font-bold text-foreground"
                  data-testid="period-margin"
                >
                  {formatPercentage(periodGrossMargin)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  {formatCurrency(periodRevenue - periodCogs)} profit
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Percent className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance & Ingredient Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Product Performance */}
        <Card data-testid="product-performance-card">
          <CardHeader>
            <CardTitle>Product Performance - {getPeriodLabel()}</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : topProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sales in selected period
              </div>
            ) : (
              <Table data-testid="product-performance-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product: any, index: number) => (
                    <TableRow
                      key={product.productId}
                      data-testid={`product-performance-row-${index}`}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {product.sku.includes("PIZ") ? (
                            <PizzaIcon className="h-4 w-4 text-primary" />
                          ) : (
                            <PillBottle className="h-4 w-4 text-blue-600" />
                          )}
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.sku}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {product.totalQty}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(product.totalRevenue)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          parseFloat(product.totalRevenue) / product.totalQty
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Ingredient Usage */}
        <Card data-testid="ingredient-usage-card">
          <CardHeader>
            <CardTitle>Ingredient Usage - {getPeriodLabel()}</CardTitle>
          </CardHeader>
          <CardContent>
            {ingredientUsage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No ingredient usage in selected period
              </div>
            ) : (
              <Table data-testid="ingredient-usage-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Avg per Sale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientUsage
                    .slice(0, 10)
                    .map((usage: any, index: number) => (
                      <TableRow
                        key={usage.ingredientId}
                        data-testid={`ingredient-usage-row-${index}`}
                      >
                        <TableCell className="font-medium">
                          {getIngredientName(usage.ingredientId)}
                        </TableCell>
                        <TableCell>
                          {usage.totalUsed.toFixed(1)}
                          {getIngredientUnit(usage.ingredientId)}
                        </TableCell>
                        <TableCell>{usage.movementCount}</TableCell>
                        <TableCell>
                          {(usage.totalUsed / usage.movementCount).toFixed(1)}
                          {getIngredientUnit(usage.ingredientId)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Status */}
      <Card data-testid="inventory-status-card">
        <CardHeader>
          <CardTitle>Current Inventory Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alerts */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                Low Stock Alerts
                {lowStockItems.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {lowStockItems.length}
                  </Badge>
                )}
              </h3>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>All ingredients well stocked!</p>
                </div>
              ) : (
                <div className="space-y-3" data-testid="low-stock-alerts">
                  {lowStockItems.map((item: any, index: number) => {
                    const isCritical =
                      parseFloat(item.totalQuantity) <
                      parseFloat(item.lowStockLevel) / 2;
                    return (
                      <div
                        key={item.ingredientId}
                        className={`p-3 border rounded-lg ${
                          isCritical
                            ? "bg-red-50 border-red-200"
                            : "bg-yellow-50 border-yellow-200"
                        }`}
                        data-testid={`low-stock-alert-${index}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p
                              className={`font-medium ${
                                isCritical ? "text-red-800" : "text-yellow-800"
                              }`}
                            >
                              {item.ingredientName}
                            </p>
                            <p
                              className={`text-sm ${
                                isCritical ? "text-red-600" : "text-yellow-600"
                              }`}
                            >
                              {parseFloat(item.totalQuantity).toFixed(1)}
                              {item.unit} remaining
                            </p>
                          </div>
                          <Badge
                            variant={isCritical ? "destructive" : "secondary"}
                          >
                            {isCritical ? "CRITICAL" : "LOW"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stock Value Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Stock Summary</h3>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Ingredients
                      </span>
                      <span className="font-semibold">
                        {currentStock.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Low Stock Items
                      </span>
                      <span className="font-semibold text-destructive">
                        {lowStockItems.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Well Stocked
                      </span>
                      <span className="font-semibold text-green-600">
                        {currentStock.length - lowStockItems.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Trend Chart Placeholder */}
      <Card className="mt-6" data-testid="sales-trend-card">
        <CardHeader>
          <CardTitle>Sales Trend - {getPeriodLabel()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="h-64 bg-muted/50 rounded-lg flex items-center justify-center"
            data-testid="sales-trend-placeholder"
          >
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <p className="text-muted-foreground">Sales trend visualization</p>
              <p className="text-sm text-muted-foreground mt-2">
                Chart showing {sales.length} transactions totaling{" "}
                {formatCurrency(periodRevenue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
