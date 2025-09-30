import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Percent,
  ShoppingBag,
  PizzaIcon,
  PillBottle,
  AlertTriangle,
  ScanBarcode,
  Package,
  ArrowRight,
} from "lucide-react";
import { useApiQuery } from "@/hooks/use-query";
import {
  getOverview,
  getTopProducts,
  getLowStock,
  getRecentActivity,
} from "@/lib/api";
import { Link } from "wouter";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useApiQuery(
    ["/api/reports/overview"],
    getOverview
  );

  const { data: topProducts = [], isLoading: productsLoading } = useApiQuery(
    ["/api/reports/top-products"],
    () =>
      getTopProducts(
        new Date(new Date().setHours(0, 0, 0, 0)),
        new Date(new Date().setHours(23, 59, 59, 999))
      )
  );

  const { data: lowStockItems = [], isLoading: stockLoading } = useApiQuery(
    ["/api/stock/low"],
    getLowStock
  );

  const { data: recentActivity = [], isLoading: activityLoading } = useApiQuery(
    ["/api/reports/activity"],
    () => getRecentActivity(5)
  );

  // Compute yesterday range for comparisons
  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const endOfYesterday = new Date(endOfToday);
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);

  const { data: yesterdaySales = [] } = useApiQuery(
    [
      "/api/sales",
      startOfYesterday.toISOString(),
      endOfYesterday.toISOString(),
    ],
    () =>
      getOverview(
        startOfYesterday.toISOString().split("T")[0],
        endOfYesterday.toISOString().split("T")[0]
      )
  );

  const yesterdayRevenue = Array.isArray(yesterdaySales)
    ? yesterdaySales.reduce(
        (sum: number, s: any) => sum + parseFloat(s.total),
        0
      )
    : 0;
  const yesterdayCogs = Array.isArray(yesterdaySales)
    ? yesterdaySales.reduce(
        (sum: number, s: any) => sum + parseFloat(s.cogs),
        0
      )
    : 0;
  const yesterdayMarginPct =
    yesterdayRevenue > 0
      ? ((yesterdayRevenue - yesterdayCogs) / yesterdayRevenue) * 100
      : 0;

  const pctChange = (todayValue: number, yesterdayValue: number) => {
    if (yesterdayValue === 0) return todayValue > 0 ? 100 : 0;
    return ((todayValue - yesterdayValue) / yesterdayValue) * 100;
  };

  const todayRevenueNum = overview ? parseFloat(overview.revenue) : 0;
  const todayMarginPct = overview ? parseFloat(overview.grossMargin) : 0;
  const revenueChangePct = pctChange(todayRevenueNum, yesterdayRevenue);
  const marginChangePct = pctChange(todayMarginPct, yesterdayMarginPct);

  // Build last 7 days revenue series using /api/sales
  const startOfWindow = new Date(startOfToday);
  startOfWindow.setDate(startOfWindow.getDate() - 6);

  const { data: windowSales = [], isLoading: salesTrendLoading } = useApiQuery(
    ["/api/sales", startOfWindow.toISOString(), endOfToday.toISOString()],
    () =>
      getOverview(
        startOfWindow.toISOString().split("T")[0],
        endOfToday.toISOString().split("T")[0]
      )
  );

  const dayKey = (d: Date) => d.toISOString().split("T")[0];
  const labels = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(startOfWindow);
    d.setDate(startOfWindow.getDate() + idx);
    return new Date(d);
  });
  const revenueByDay = new Map<string, number>();
  labels.forEach((d) => revenueByDay.set(dayKey(d), 0));
  if (Array.isArray(windowSales)) {
    for (const sale of windowSales as any[]) {
      const created = new Date(sale.createdAt);
      const key = dayKey(created);
      if (revenueByDay.has(key)) {
        revenueByDay.set(
          key,
          (revenueByDay.get(key) || 0) + parseFloat(sale.total)
        );
      }
    }
  }
  const salesTrendData = labels.map((d) => ({
    date: d,
    label: d.toLocaleDateString(undefined, { weekday: "short" }),
    revenue: revenueByDay.get(dayKey(d)) || 0,
  }));

  const formatPercentage = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  return (
    <Layout
      title="Dashboard"
      description="Overview of your pizza truck operations"
    >
      {/* KPI Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        data-testid="kpi-cards"
      >
        <Card data-testid="revenue-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today's Revenue
                </p>
                <p
                  className="text-2xl font-bold text-foreground"
                  data-testid="today-revenue"
                >
                  {overviewLoading
                    ? "..."
                    : formatCurrency(overview?.revenue || 0)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  {overviewLoading
                    ? ""
                    : `${
                        revenueChangePct >= 0 ? "+" : ""
                      }${revenueChangePct.toFixed(1)}% vs yesterday`}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="cogs-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  COGS
                </p>
                <p
                  className="text-2xl font-bold text-foreground"
                  data-testid="today-cogs"
                >
                  {overviewLoading
                    ? "..."
                    : formatCurrency(overview?.cogs || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview && overview.revenue > 0
                    ? `${(
                        (parseFloat(overview.cogs) /
                          parseFloat(overview.revenue)) *
                        100
                      ).toFixed(0)}% of revenue`
                    : "0% of revenue"}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="margin-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Gross Margin
                </p>
                <p
                  className="text-2xl font-bold text-foreground"
                  data-testid="gross-margin"
                >
                  {overviewLoading
                    ? "..."
                    : formatPercentage(overview?.grossMargin || 0)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  {overviewLoading
                    ? ""
                    : `${
                        marginChangePct >= 0 ? "+" : ""
                      }${marginChangePct.toFixed(1)}% vs yesterday`}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Percent className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="orders-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Orders Today
                </p>
                <p
                  className="text-2xl font-bold text-foreground"
                  data-testid="today-orders"
                >
                  {overviewLoading ? "..." : overview?.orderCount || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg:{" "}
                  {overview && overview.orderCount > 0
                    ? formatCurrency(
                        parseFloat(overview.revenue) / overview.orderCount
                      )
                    : "$0.00"}{" "}
                  per order
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        data-testid="dashboard-grid"
      >
        {/* Top Products */}
        <Card className="lg:col-span-2" data-testid="top-products-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Products Today</CardTitle>
              <Link href="/reports">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="view-all-products"
                >
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="products-list">
              {productsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sales today yet
                </div>
              ) : (
                topProducts.slice(0, 3).map((product: any) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    data-testid={`product-${product.sku.toLowerCase()}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {product.sku.includes("PIZ") ? (
                          <PizzaIcon className="h-5 w-5 text-primary" />
                        ) : (
                          <PillBottle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p
                          className="font-medium text-foreground"
                          data-testid={`product-name-${product.sku.toLowerCase()}`}
                        >
                          {product.productName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {product.sku}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-semibold text-foreground"
                        data-testid={`product-qty-${product.sku.toLowerCase()}`}
                      >
                        {product.totalQty} sold
                      </p>
                      <p
                        className="text-sm text-green-600"
                        data-testid={`product-revenue-${product.sku.toLowerCase()}`}
                      >
                        {formatCurrency(product.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card data-testid="low-stock-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Low Stock Alert</CardTitle>
              {lowStockItems.length > 0 && (
                <Badge variant="destructive" data-testid="low-stock-count">
                  {lowStockItems.length} items
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="low-stock-list">
              {stockLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading...
                </div>
              ) : lowStockItems.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  All ingredients well stocked!
                </div>
              ) : (
                lowStockItems.slice(0, 3).map((item: any) => {
                  const isCritical =
                    parseFloat(item.totalQuantity) <
                    parseFloat(item.lowStockLevel) / 2;
                  return (
                    <div
                      key={item.ingredientId}
                      className={`flex items-center justify-between p-3 border rounded-lg low-stock ${
                        isCritical
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                      data-testid={`low-stock-${item.ingredientName
                        .toLowerCase()
                        .replace(/ /g, "-")}`}
                    >
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
                      <div className="text-right">
                        <Badge
                          variant={isCritical ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {isCritical ? "CRITICAL" : "LOW"}
                        </Badge>
                        <p
                          className={`text-xs mt-1 ${
                            isCritical ? "text-red-500" : "text-yellow-500"
                          }`}
                        >
                          Min: {parseFloat(item.lowStockLevel).toFixed(1)}
                          {item.unit}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {lowStockItems.length > 0 && (
              <div className="mt-4">
                <Link href="/purchases">
                  <Button
                    className="w-full"
                    data-testid="create-purchase-order"
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Create Purchase Order
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card data-testid="recent-activity-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Sales
              </Button>
              <Button variant="secondary" size="sm">
                All Activity
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="activity-list">
            {activityLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            ) : (
              recentActivity.map((activity: any, index: number) => (
                <div
                  key={activity.id || index}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors"
                  data-testid={`activity-${activity.type}-${index}`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.type === "sale"
                          ? "bg-green-100"
                          : "bg-blue-100"
                      }`}
                    >
                      {activity.type === "sale" ? (
                        <ScanBarcode className="h-5 w-5 text-green-600" />
                      ) : (
                        <Package className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {activity.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.type === "sale"
                          ? "Cash Sale"
                          : "Stock Movement"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.amount && (
                      <p className="font-semibold text-green-600">
                        +{formatCurrency(activity.amount)}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {recentActivity.length > 0 && (
            <div className="mt-6 text-center">
              <Link href="/reports">
                <Button variant="ghost" data-testid="view-full-activity">
                  View Full Activity Log <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Trend (Last 7 Days) */}
      <Card data-testid="sales-chart-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Revenue</span>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {salesTrendLoading ? (
              <div className="h-full bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <ChartContainer
                config={{
                  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
                }}
                className="h-full"
              >
                <AreaChart
                  data={salesTrendData}
                  margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
                >
                  <defs>
                    <linearGradient
                      id="fillRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={56}
                    tickFormatter={(v) =>
                      formatCurrency(Math.round(v)).replace(/[A-Z]/, "")
                    }
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    fill="url(#fillRevenue)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
