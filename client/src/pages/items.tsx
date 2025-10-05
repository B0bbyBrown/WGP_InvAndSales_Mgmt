import { useState } from "react";
import Layout from "@/components/Layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getItems, createItem } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { NewItem } from "@shared/schema";

export default function Items() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/items"],
    queryFn: getItems,
  });

  const createMutation = useMutation({
    mutationFn: (newItem: NewItem) => createItem(newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Item created successfully" });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Layout
      title="Items"
      description="Manage all ingredients, sub-assemblies, and sellable products."
    >
      <div className="flex justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create New Item</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Item</DialogTitle>
            </DialogHeader>
            <ItemForm
              items={items}
              onSubmit={(values) => createMutation.mutate(values)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Low Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.sku}</TableCell>
              <TableCell>
                <Badge>{item.type}</Badge>
              </TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>
                {item.price ? `$${item.price.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell>{item.lowStockLevel || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Layout>
  );
}

const ItemForm = ({ items, onSubmit, isPending }) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [type, setType] = useState<"RAW" | "MANUFACTURED" | "SELLABLE">(
    "RAW"
  );
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [lowStockLevel, setLowStockLevel] = useState("");
  const [recipe, setRecipe] = useState<{ childItemId: string; quantity: string }[]>(
    []
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const values: NewItem = {
      name,
      sku: sku || undefined,
      type,
      unit,
      price: price ? parseFloat(price) : undefined,
      lowStockLevel: lowStockLevel ? parseFloat(lowStockLevel) : undefined,
      recipe: type !== "RAW" ? recipe : undefined,
    };
    onSubmit(values);
  };

  const handleAddRecipeItem = () => {
    setRecipe([...recipe, { childItemId: "", quantity: "" }]);
  };

  const handleRecipeChange = (index, field, value) => {
    const newRecipe = [...recipe];
    newRecipe[index][field] = value;
    setRecipe(newRecipe);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <Select onValueChange={(v) => setType(v as any)} value={type}>
          <SelectTrigger>
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RAW">Raw Ingredient</SelectItem>
            <SelectItem value="MANUFACTURED">Manufactured Item</SelectItem>
            <SelectItem value="SELLABLE">Sellable Product</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {type === "SELLABLE" && (
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
      )}
      <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="lowStockLevel">Low Stock Level</Label>
        <Input
            id="lowStockLevel"
            type="number"
            value={lowStockLevel}
            onChange={(e) => setLowStockLevel(e.target.value)}
        />
      </div>

      {type !== "RAW" && (
        <div>
          <h3 className="font-medium mb-2">Recipe</h3>
          {recipe.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2 items-center">
              <Select
                onValueChange={(v) => handleRecipeChange(index, "childItemId", v)}
                value={item.childItemId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items
                    .filter((i) => i.id !== item.childItemId)
                    .map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) =>
                  handleRecipeChange(index, "quantity", e.target.value)
                }
                className="w-24"
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAddRecipeItem}>
            Add Recipe Item
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Item"}
        </Button>
      </div>
    </form>
  );
};
