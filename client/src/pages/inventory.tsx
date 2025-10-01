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
  Dialog,
  DialogContent,
  DialogDescription,
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
  Package,
  Plus,
  Minus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getCurrentStock,
  getLowStock,
  getStockMovements,
  adjustStock,
  getIngredients,
  createIngredient,
} from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Inventory() {
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<string>("");
  const [adjustmentNote, setAdjustmentNote] = useState<string>("");
  const [newIngredientName, setNewIngredientName] = useState<string>("");
  const [newIngredientUnit, setNewIngredientUnit] = useState<string>("");
  const [newIngredientLowStock, setNewIngredientLowStock] =
    useState<string>("");
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [isAddIngredientDialogOpen, setIsAddIngredientDialogOpen] =
    useState(false);

  const { toast } = useToast();

  const { data: currentStock = [], isLoading: stockLoading } = useQuery({
    queryKey: ["/api/stock/current"],
    queryFn: () => getCurrentStock(),
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/stock/low"],
    queryFn: () => getLowStock(),
  });

  const { data: stockMovements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/stock/movements"],
    queryFn: () => getStockMovements(),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["/api/ingredients"],
    queryFn: () => getIngredients(),
  });

  const adjustStockMutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Stock adjusted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/low"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/movements"] });
      setIsAdjustmentDialogOpen(false);
      setSelectedIngredient("");
      setAdjustmentQuantity("");
      setAdjustmentNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to adjust stock",
        variant: "destructive",
      });
    },
  });

  const createIngredientMutation = useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ingredient created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock/current"] });
      setIsAddIngredientDialogOpen(false);
      setNewIngredientName("");
      setNewIngredientUnit("");
      setNewIngredientLowStock("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ingredient",
        variant: "destructive",
      });
    },
  });

  const handleStockAdjustment = () => {
    if (!selectedIngredient || !adjustmentQuantity) {
      toast({
        title: "Error",
        description: "Please select an ingredient and enter a quantity",
        variant: "destructive",
      });
      return;
    }

    adjustStockMutation.mutate({
      ingredientId: selectedIngredient,
      quantity: adjustmentQuantity,
      note: adjustmentNote,
    });
  };

  const handleCreateIngredient = () => {
    if (!newIngredientName || !newIngredientUnit) {
      toast({
        title: "Error",
        description: "Please enter ingredient name and unit",
        variant: "destructive",
      });
      return;
    }

    createIngredientMutation.mutate({
      name: newIngredientName,
      unit: newIngredientUnit,
      low_stock_level: newIngredientLowStock
        ? parseFloat(newIngredientLowStock)
        : null,
    });
  };

  const formatQuantity = (quantity: string, unit: string) => {
    const num = parseFloat(quantity);
    return `${num.toFixed(num % 1 === 0 ? 0 : 1)}${unit}`;
  };

  const getStockStatus = (item: any) => {
    if (!item.lowStockLevel) return "normal";
    const current = parseFloat(item.totalQuantity);
    const low = parseFloat(item.lowStockLevel);
    if (current < low / 2) return "critical";
    if (current < low) return "low";
    return "normal";
  };

  return (
    <Layout
      title="Inventory Management"
      description="Monitor and manage ingredient stock levels"
    >
      {/* Action Bar */}
      <div
        className="flex items-center justify-between mb-6"
        data-testid="inventory-actions"
      >
        <div className="flex items-center space-x-4">
          <Dialog
            open={isAdjustmentDialogOpen}
            onOpenChange={setIsAdjustmentDialogOpen}
          >
            <DialogTrigger asChild>
              <Button data-testid="adjust-stock-button">
                <Activity className="mr-2 h-4 w-4" />
                Adjust Stock
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="adjustment-dialog">
              <DialogHeader>
                <DialogTitle>Stock Adjustment</DialogTitle>
                <DialogDescription>
                  Adjust the stock level for an ingredient by adding or removing
                  quantity.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ingredient">Ingredient</Label>
                  <Select
                    value={selectedIngredient}
                    onValueChange={setSelectedIngredient}
                  >
                    <SelectTrigger data-testid="ingredient-select">
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ingredient: any) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} ({ingredient.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">
                    Quantity (positive to add, negative to remove)
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    placeholder="e.g. 5 or -2.5"
                    data-testid="quantity-input"
                  />
                </div>
                <div>
                  <Label htmlFor="note">Note (optional)</Label>
                  <Input
                    id="note"
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                    placeholder="Reason for adjustment"
                    data-testid="note-input"
                  />
                </div>
                <Button
                  onClick={handleStockAdjustment}
                  disabled={adjustStockMutation.isPending}
                  className="w-full"
                  data-testid="confirm-adjustment-button"
                >
                  {adjustStockMutation.isPending
                    ? "Adjusting..."
                    : "Adjust Stock"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card
          className="mb-6 border-destructive bg-destructive/5"
          data-testid="low-stock-alert"
        >
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Low Stock Alert
              <Badge variant="destructive" className="ml-2">
                {lowStockItems.length} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((item: any) => (
                <div
                  key={item.ingredientId}
                  className="p-3 border rounded-lg bg-card"
                  data-testid={`low-stock-item-${item.ingredientName
                    .toLowerCase()
                    .replace(/ /g, "-")}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.ingredientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatQuantity(item.totalQuantity, item.unit)}{" "}
                        remaining
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {parseFloat(item.totalQuantity) <
                      parseFloat(item.lowStockLevel) / 2
                        ? "CRITICAL"
                        : "LOW"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Min: {formatQuantity(item.lowStockLevel, item.unit)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Stock Table */}
      <Card data-testid="current-stock-card">
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          {stockLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading stock levels...</p>
            </div>
          ) : (
            <Table data-testid="stock-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Low Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStock.map((item: any) => {
                  const status = getStockStatus(item);
                  return (
                    <TableRow
                      key={item.ingredientId}
                      data-testid={`stock-row-${item.ingredientName
                        .toLowerCase()
                        .replace(/ /g, "-")}`}
                    >
                      <TableCell className="font-medium">
                        {item.ingredientName}
                      </TableCell>
                      <TableCell>
                        {formatQuantity(item.totalQuantity, item.unit)}
                      </TableCell>
                      <TableCell>
                        {item.lowStockLevel
                          ? formatQuantity(item.lowStockLevel, item.unit)
                          : "Not set"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            status === "critical"
                              ? "destructive"
                              : status === "low"
                              ? "secondary"
                              : "default"
                          }
                          className={
                            status === "low"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : ""
                          }
                        >
                          {status === "critical"
                            ? "CRITICAL"
                            : status === "low"
                            ? "LOW"
                            : "OK"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIngredient(item.ingredientId);
                              setAdjustmentQuantity("1");
                              setIsAdjustmentDialogOpen(true);
                            }}
                            data-testid={`quick-add-${item.ingredientName
                              .toLowerCase()
                              .replace(/ /g, "-")}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIngredient(item.ingredientId);
                              setAdjustmentQuantity("-1");
                              setIsAdjustmentDialogOpen(true);
                            }}
                            data-testid={`quick-remove-${item.ingredientName
                              .toLowerCase()
                              .replace(/ /g, "-")}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stock Movements */}
      <Card className="mt-6" data-testid="stock-movements-card">
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {movementsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading movements...</p>
            </div>
          ) : (
            <Table data-testid="movements-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements
                  .slice(0, 10)
                  .map((movement: any, index: number) => {
                    const ingredient = ingredients.find(
                      (ing: any) => ing.id === movement.ingredientId
                    );
                    const quantity = parseFloat(movement.quantity);
                    const isPositive = quantity > 0;

                    return (
                      <TableRow
                        key={movement.id || index}
                        data-testid={`movement-row-${index}`}
                      >
                        <TableCell>
                          {new Date(movement.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              movement.kind === "PURCHASE"
                                ? "default"
                                : movement.kind === "SALE_CONSUME"
                                ? "secondary"
                                : movement.kind === "ADJUSTMENT"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {movement.kind.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{ingredient?.name || "Unknown"}</TableCell>
                        <TableCell
                          className={
                            isPositive ? "text-green-600" : "text-red-600"
                          }
                        >
                          {isPositive ? "+" : ""}
                          {quantity.toFixed(1)}
                          {ingredient?.unit || ""}
                          {isPositive ? (
                            <TrendingUp className="inline h-3 w-3 ml-1" />
                          ) : (
                            <TrendingDown className="inline h-3 w-3 ml-1" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.note || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
