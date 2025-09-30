import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
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
  Utensils,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Package,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getProducts,
  createProduct,
  getIngredients,
  getProductRecipe,
} from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";

interface RecipeItem {
  ingredientId: string;
  quantity: string;
}

export default function Products() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);

  // Form state
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productActive, setProductActive] = useState(true);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([
    { ingredientId: "", quantity: "" },
  ]);

  const { toast } = useToast();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: () => getProducts(),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["/api/ingredients"],
    queryFn: () => getIngredients(),
  });

  const { data: productRecipe = [] } = useQuery({
    queryKey: ["/api/products", selectedProduct?.id, "recipe"],
    queryFn: () => getProductRecipe(selectedProduct.id),
    enabled: !!selectedProduct,
  });

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setProductName("");
    setProductSku("");
    setProductPrice("");
    setProductActive(true);
    setRecipeItems([{ ingredientId: "", quantity: "" }]);
  };

  const handleCreateProduct = () => {
    if (!productName || !productSku || !productPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const validRecipeItems = recipeItems
      .filter((item) => item.ingredientId && item.quantity)
      .map((item) => ({
        ingredientId: item.ingredientId,
        quantity: String(parseFloat(item.quantity)),
      }));

    createProductMutation.mutate({
      name: productName,
      sku: productSku,
      price: String(parseFloat(productPrice)),
      active: productActive,
      recipe: validRecipeItems,
    });
  };

  const addRecipeItem = () => {
    setRecipeItems([...recipeItems, { ingredientId: "", quantity: "" }]);
  };

  const removeRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const updateRecipeItem = (
    index: number,
    field: keyof RecipeItem,
    value: string
  ) => {
    const updated = [...recipeItems];
    updated[index][field] = value;
    setRecipeItems(updated);
  };

  const viewRecipe = (product: any) => {
    setSelectedProduct(product);
    setIsRecipeDialogOpen(true);
  };

  return (
    <Layout
      title="Products & Recipes"
      description="Manage your menu items and their ingredient recipes"
    >
      {/* Action Bar */}
      <div
        className="flex items-center justify-between mb-6"
        data-testid="products-actions"
      >
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-product-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-2xl"
            data-testid="create-product-dialog"
          >
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Fill out product details and optional recipe items. Fields
                marked * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Product Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Margherita Pizza"
                    data-testid="product-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={productSku}
                    onChange={(e) => setProductSku(e.target.value)}
                    placeholder="e.g. PIZ-MARG"
                    data-testid="product-sku-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="0.00"
                    data-testid="product-price-input"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={productActive}
                    onCheckedChange={setProductActive}
                    data-testid="product-active-switch"
                  />
                  <Label>Active</Label>
                </div>
              </div>

              {/* Recipe Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Recipe (Bill of Materials)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRecipeItem}
                    data-testid="add-recipe-item-button"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Ingredient
                  </Button>
                </div>

                <div className="space-y-3" data-testid="recipe-items">
                  {recipeItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <Select
                          value={item.ingredientId}
                          onValueChange={(value) =>
                            updateRecipeItem(index, "ingredientId", value)
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
                      <div className="w-32">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateRecipeItem(index, "quantity", e.target.value)
                          }
                          placeholder="Qty"
                          data-testid={`quantity-input-${index}`}
                        />
                      </div>
                      {recipeItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRecipeItem(index)}
                          data-testid={`remove-recipe-item-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreateProduct}
                disabled={createProductMutation.isPending}
                className="w-full"
                data-testid="confirm-create-product-button"
              >
                {createProductMutation.isPending
                  ? "Creating..."
                  : "Create Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        data-testid="products-grid"
      >
        {productsLoading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No products created yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first product to get started
            </p>
          </div>
        ) : (
          products.map((product: any) => (
            <Card
              key={product.id}
              className="relative"
              data-testid={`product-card-${product.sku.toLowerCase()}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle
                      className="text-lg"
                      data-testid={`product-name-${product.sku.toLowerCase()}`}
                    >
                      {product.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.sku}
                    </p>
                  </div>
                  <Badge variant={product.active ? "default" : "secondary"}>
                    {product.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span
                      className="font-semibold text-lg"
                      data-testid={`product-price-${product.sku.toLowerCase()}`}
                    >
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => viewRecipe(product)}
                      data-testid={`view-recipe-${product.sku.toLowerCase()}`}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      View Recipe
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`edit-product-${product.sku.toLowerCase()}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recipe View Dialog */}
      <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
        <DialogContent data-testid="recipe-view-dialog">
          <DialogHeader>
            <DialogTitle>Recipe: {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              View the ingredients and quantities used for this product.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <p className="text-sm">{selectedProduct?.sku}</p>
              </div>
              <div>
                <Label>Price</Label>
                <p className="text-sm font-semibold">
                  {selectedProduct && formatCurrency(selectedProduct.price)}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Ingredients</Label>
              {productRecipe.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  No recipe items defined
                </p>
              ) : (
                <Table className="mt-2" data-testid="recipe-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productRecipe.map((item: any, index: number) => {
                      const ingredient = ingredients.find(
                        (ing: any) => ing.id === item.ingredientId
                      );
                      return (
                        <TableRow
                          key={index}
                          data-testid={`recipe-row-${index}`}
                        >
                          <TableCell>{ingredient?.name || "Unknown"}</TableCell>
                          <TableCell>
                            {parseFloat(item.quantity).toFixed(1)}
                          </TableCell>
                          <TableCell>{ingredient?.unit || ""}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
