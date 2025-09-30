import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Package,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getPurchases,
  createPurchase,
  getIngredients,
  getSuppliers,
} from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/format";

interface PurchaseItem {
  ingredientId: string;
  quantity: string;
  totalCost: string;
}

export default function Purchases() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    { ingredientId: "", quantity: "", totalCost: "" },
  ]);

  const { toast } = useToast();

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ["/api/purchases"],
    queryFn: () => getPurchases(),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["/api/ingredients"],
    queryFn: () => getIngredients(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: () => getSuppliers(),
  });

  const createPurchaseMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/movements"] });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedSupplier("");
    setNotes("");
    setPurchaseItems([{ ingredientId: "", quantity: "", totalCost: "" }]);
  };

  const handleCreatePurchase = () => {
    const validItems = purchaseItems.filter(
      (item) => item.ingredientId && item.quantity && item.totalCost
    );

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid purchase item",
        variant: "destructive",
      });
      return;
    }

    createPurchaseMutation.mutate({
      supplierId: selectedSupplier || undefined,
      notes: notes || undefined,
      items: validItems,
    });
  };

  const addPurchaseItem = () => {
    setPurchaseItems([
      ...purchaseItems,
      { ingredientId: "", quantity: "", totalCost: "" },
    ]);
  };

  const removePurchaseItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const updatePurchaseItem = (
    index: number,
    field: keyof PurchaseItem,
    value: string
  ) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;
    setPurchaseItems(updated);
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((total, item) => {
      return total + (parseFloat(item.totalCost) || 0);
    }, 0);
  };

  const calculateUnitCost = (totalCost: string, quantity: string) => {
    const total = parseFloat(totalCost);
    const qty = parseFloat(quantity);
    if (total > 0 && qty > 0) {
      return (total / qty).toFixed(2);
    }
    return "0.00";
  };

  return (
    <Layout
      title="Purchase Orders"
      description="Create and manage inventory purchase orders"
    >
      {/* Action Bar */}
      <div
        className="flex items-center justify-between mb-6"
        data-testid="purchases-actions"
      >
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-purchase-button">
              <Plus className="mr-2 h-4 w-4" />
              New Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            data-testid="create-purchase-dialog"
          >
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Supplier (optional)</Label>
                  <Select
                    value={selectedSupplier}
                    onValueChange={setSelectedSupplier}
                  >
                    <SelectTrigger data-testid="supplier-select">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Purchase order notes..."
                    className="h-[60px]"
                    data-testid="notes-input"
                  />
                </div>
              </div>

              {/* Purchase Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Purchase Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPurchaseItem}
                    data-testid="add-purchase-item-button"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4" data-testid="purchase-items">
                  {purchaseItems.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-5">
                          <Label>Ingredient</Label>
                          <Select
                            value={item.ingredientId}
                            onValueChange={(value) =>
                              updatePurchaseItem(index, "ingredientId", value)
                            }
                          >
                            <SelectTrigger
                              data-testid={`ingredient-select-${index}`}
                            >
                              <SelectValue placeholder="Select ingredient" />
                            </SelectTrigger>
                            <SelectContent>
                              {ingredients.map((ingredient: any) => (
                                <SelectItem
                                  key={ingredient.id}
                                  value={ingredient.id}
                                >
                                  {ingredient.name} ({ingredient.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantity}
                            onChange={(e) =>
                              updatePurchaseItem(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            placeholder="0"
                            data-testid={`quantity-input-${index}`}
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Total Cost</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.totalCost}
                            onChange={(e) =>
                              updatePurchaseItem(
                                index,
                                "totalCost",
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                            data-testid={`cost-input-${index}`}
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Unit Cost</Label>
                          <p className="text-sm text-muted-foreground mt-2">
                            ${calculateUnitCost(item.totalCost, item.quantity)}
                          </p>
                        </div>

                        <div className="col-span-1">
                          {purchaseItems.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePurchaseItem(index)}
                              data-testid={`remove-item-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Total */}
              <Card className="p-4 bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    Total Purchase Cost:
                  </span>
                  <span className="text-2xl font-bold" data-testid="total-cost">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </Card>

              <Button
                onClick={handleCreatePurchase}
                disabled={createPurchaseMutation.isPending}
                className="w-full"
                data-testid="confirm-purchase-button"
              >
                {createPurchaseMutation.isPending
                  ? "Creating..."
                  : "Create Purchase Order"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Purchase History */}
      <Card data-testid="purchases-history-card">
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          {purchasesLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading purchases...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No purchase orders yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first purchase order to track inventory
              </p>
            </div>
          ) : (
            <Table data-testid="purchases-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Purchase ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase: any, index: number) => (
                  <TableRow
                    key={purchase.id}
                    data-testid={`purchase-row-${index}`}
                  >
                    <TableCell>{formatDate(purchase.createdAt)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      #{purchase.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {purchase.supplierId ? (
                        suppliers.find((s: any) => s.id === purchase.supplierId)
                          ?.name || "Unknown"
                      ) : (
                        <span className="text-muted-foreground">
                          No supplier
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        Multiple items
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {purchase.notes || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`view-purchase-${index}`}
                      >
                        <Package className="h-4 w-4" />
                      </Button>
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
