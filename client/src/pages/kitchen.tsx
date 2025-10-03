import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingOrders, updateSaleItemStatus } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

function Kitchen() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/kitchen/orders"],
    queryFn: getPendingOrders,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateSaleItemStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/orders"] });
      toast({ title: "Status updated" });
    },
    onError: (error) => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  const getNextStatus = (current: string) => {
    switch (current) {
      case "PENDING":
        return "RECEIVED";
      case "RECEIVED":
        return "PREPPING";
      case "PREPPING":
        return "DONE";
      default:
        return null;
    }
  };

  const statusColors: { [key: string]: string } = {
    PENDING: "bg-yellow-500",
    RECEIVED: "bg-blue-500",
    PREPPING: "bg-orange-500",
    DONE: "bg-green-500",
  };

  const getActionText = (next: string) => {
    switch (next) {
      case "RECEIVED":
        return "Receive";
      case "PREPPING":
        return "Start Prepping";
      case "DONE":
        return "Mark Done";
      default:
        return "";
    }
  };

  return (
    <Layout title="Kitchen" description="Manage order preparation">
      <Card>
        <CardHeader>
          <CardTitle>Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending orders
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.sale.id} className="mb-6">
                <div className="flex justify-between mb-2">
                  <h3 className="font-bold">
                    Order #{order.sale.id.slice(-6).toUpperCase()}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(order.sale.createdAt)}
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => {
                      const nextStatus = getNextStatus(item.status);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[item.status]}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {nextStatus && (
                              <Button
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: item.id,
                                    status: nextStatus,
                                  })
                                }
                                disabled={updateMutation.isPending}
                              >
                                {getActionText(nextStatus)}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}

export default Kitchen;

