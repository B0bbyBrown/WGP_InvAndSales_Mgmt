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
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Wallet,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getItems,
  createSale,
  getSales,
  getActiveCashSession,
  getRawMaterials,
} from "@/lib/api";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/format";
import { useLocation } from "wouter";

interface SaleItem {
  itemId: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  itemName: string;
  sku: string;
}

export default function Sales() {
  const [, setLocation] = useLocation(); // Use setLocation for navigation
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentType, setPaymentType] = useState<"CASH" | "CARD" | "OTHER">(
    "CASH"
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ["/api/raw-materials"],
    queryFn: getRawMaterials,
  });
  const sellableItems = products.filter((item) => item.type === "SELLABLE");

  const { data: activeSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/sessions/active"],
    queryFn: getActiveCashSession,
    staleTime: 0, // Force refetch
  });

  // Log active session for debugging
  useEffect(() => {
    if (!sessionLoading) {
      console.log("Point of Sale - Active Session:", activeSession);
    }
  }, [activeSession, sessionLoading]);

  const { data: recentSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: () => getSales(),
    staleTime: 0, // Force refetch after invalidation
  });

  const createSaleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: async (sale) => {
      // Make async
      toast({
        title: "Sale Completed",
        description: `Sale total: ${formatCurrency(
          sale.total
        )} | COGS: ${formatCurrency(
          sale.cogs
        )} | Margin: ${calculateMarginPercent(sale.total, sale.cogs)}%`,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      await queryClient.refetchQueries({ queryKey: ["/api/sales"] }); // Force refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/stock/current"] });
      await queryClient.invalidateQueries({
        queryKey: ["/api/reports/overview"],
      });
      setSaleItems([]);
    },
    onError: (error: any) => {
      toast({
        title: "Sale Failed",
        description: error.message || "Unable to complete sale",
        variant: "destructive",
      });
    },
  });

  if (sessionLoading || products.length === 0) {
    return <div>Loading...</div>;
  }

  if (!activeSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Cash Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please open a cash session before making sales.</p>
          <Button onClick={() => setLocation("/sessions")}>
            Go to Sessions
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredItems = sellableItems.filter(
    (item: any) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addItemToSale = (itemId: string) => {
    const itemToAdd = sellableItems.find((p: any) => p.id === itemId);
    if (!itemToAdd) return;

    const existingItemIndex = saleItems.findIndex(
      (item) => item.itemId === itemId
    );

    if (existingItemIndex >= 0) {
      const updated = [...saleItems];
      updated[existingItemIndex].qty += 1;
      updated[existingItemIndex].lineTotal =
        updated[existingItemIndex].qty * updated[existingItemIndex].unitPrice;
      setSaleItems(updated);
    } else {
      const newItem: SaleItem = {
        itemId: itemToAdd.id,
        qty: 1,
        unitPrice: parseFloat(itemToAdd.price),
        lineTotal: parseFloat(itemToAdd.price),
        itemName: itemToAdd.name,
        sku: itemToAdd.sku,
      };
      setSaleItems([...saleItems, newItem]);
    }
  };

  const updateItemQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setSaleItems(saleItems.filter((item) => item.itemId !== itemId));
      return;
    }

    const updated = saleItems.map((item) =>
      item.itemId === itemId
        ? { ...item, qty: newQty, lineTotal: newQty * item.unitPrice }
        : item
    );
    setSaleItems(updated);
  };

  const removeItemFromSale = (itemId: string) => {
    setSaleItems(saleItems.filter((item) => item.itemId !== itemId));
  };

  const calculateSubtotal = () => {
    return saleItems.reduce((total, item) => total + item.lineTotal, 0);
  };

  const handleCompleteSale = () => {
    if (saleItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to the sale",
        variant: "destructive",
      });
      return;
    }

    const saleData = {
      sessionId: activeSession?.id,
      paymentType,
      items: saleItems.map((item) => ({
        itemId: item.itemId,
        qty: item.qty,
      })),
    };

    createSaleMutation.mutate(saleData);
  };

  const calculateMarginPercent = (
    revenue: string | number,
    cogs: string | number
  ) => {
    const rev = typeof revenue === "string" ? parseFloat(revenue) : revenue;
    const cost = typeof cogs === "string" ? parseFloat(cogs) : cogs;
    if (rev === 0) return 0;
    return (((rev - cost) / rev) * 100).toFixed(1);
  };

  return (
    <Layout
      title="Point of Sale"
      description="Process sales and manage transactions"
    >
      {/* Session Status Warning */}
      {!activeSession && (
        <Card
          className="mb-6 border-destructive bg-destructive/5"
          data-testid="no-session-warning"
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
              <span className="text-destructive font-medium">
                No active cash session. Sales can still be processed, but they
                won't be linked to a session.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Selection */}
        <Card data-testid="product-selection-card">
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="product-search-input"
            />
          </CardHeader>
          <CardContent>
            <div
              className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto"
              data-testid="products-list"
            >
              {filteredItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => addItemToSale(item.id)}
                  data-testid={`product-item-${item.sku.toLowerCase()}`}
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(item.price)}
                    </p>
                    <Button
                      size="sm"
                      className="mt-1"
                      data-testid={`add-product-${item.sku.toLowerCase()}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm
                    ? "No products found"
                    : "No active products available"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sale Items & Checkout */}
        <Card data-testid="sale-items-card">
          <CardHeader>
            <CardTitle>Current Sale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sale Items */}
            <div
              className="max-h-64 overflow-y-auto"
              data-testid="sale-items-list"
            >
              {saleItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                  <p>No items in sale</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {saleItems.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`sale-item-${item.sku.toLowerCase()}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.sku}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateItemQuantity(item.itemId, item.qty - 1)
                          }
                          data-testid={`decrease-qty-${item.sku.toLowerCase()}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span
                          className="w-8 text-center"
                          data-testid={`qty-${item.sku.toLowerCase()}`}
                        >
                          {item.qty}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateItemQuantity(item.itemId, item.qty + 1)
                          }
                          data-testid={`increase-qty-${item.sku.toLowerCase()}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="w-20 text-right font-medium">
                          {formatCurrency(item.lineTotal)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeItemFromSale(item.itemId)}
                          data-testid={`remove-item-${item.sku.toLowerCase()}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span data-testid="sale-total">
                  {formatCurrency(calculateSubtotal())}
                </span>
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <Label>Payment Method</Label>
              <Select
                value={paymentType}
                onValueChange={(value: any) => setPaymentType(value)}
              >
                <SelectTrigger data-testid="payment-method-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 mr-2" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="CARD">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Card
                    </div>
                  </SelectItem>
                  <SelectItem value="OTHER">
                    <div className="flex items-center">
                      <Wallet className="h-4 w-4 mr-2" />
                      Other
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Complete Sale Button */}
            <Button
              onClick={handleCompleteSale}
              disabled={createSaleMutation.isPending || saleItems.length === 0}
              className="w-full"
              size="lg"
              data-testid="complete-sale-button"
            >
              {createSaleMutation.isPending ? "Processing..." : "Complete Sale"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card className="mt-6" data-testid="recent-sales-card">
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading sales...</p>
            </div>
          ) : (
            <Table data-testid="recent-sales-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>COGS</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Session</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.slice(0, 10).map((sale: any, index: number) => (
                  <TableRow key={sale.id} data-testid={`sale-row-${index}`}>
                    <TableCell>{formatDate(sale.createdAt)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      #{sale.id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-orange-600">
                      {formatCurrency(sale.cogs)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {calculateMarginPercent(sale.total, sale.cogs)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sale.paymentType === "CASH"
                            ? "default"
                            : sale.paymentType === "CARD"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {sale.paymentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sale.sessionId ? (
                        <Badge variant="default" className="text-xs">
                          Session
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No session
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
