import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingOrders, updateSaleItemStatus } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

function Kitchen() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/kitchen/orders"],
    queryFn: getPendingOrders,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateSaleItemStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kitchen/orders"] });
      toast({ title: "Status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Layout title="Kitchen" description="Manage order preparation">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Kitchen" description="Manage order preparation">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {orders.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              No pending orders
            </div>
          ) : (
            orders.map((order) => (
              <motion.div
                key={order.sale.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <OrderCard order={order} mutation={updateMutation} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

const OrderCard = ({ order, mutation }) => {
  const getNextStatus = (current: string) => {
    switch (current) {
      case "PENDING":
        return "PREPPING";
      case "PREPPING":
        return "DONE";
      default:
        return null;
    }
  };

  const statusColors: { [key: string]: string } = {
    PENDING: "bg-yellow-500",
    PREPPING: "bg-orange-500",
    DONE: "bg-green-500",
  };
  const statusBorderColors: { [key: string]: string } = {
    PENDING: "border-yellow-500",
    PREPPING: "border-orange-500",
    DONE: "border-green-500",
  };


  const handleUpdateStatus = (item, nextStatus) => {
    if (nextStatus) {
      mutation.mutate({ id: item.id, status: nextStatus });
    }
  };

  const allItemsDone = order.items.every((item) => item.status === "DONE");

  return (
    <Card
      className={`flex flex-col h-full ${
        allItemsDone
          ? "border-green-500"
          : statusBorderColors[order.items[0].status]
      }`}
    >
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Order #{order.sale.id.slice(-6).toUpperCase()}
        </CardTitle>
        <Badge
          variant={allItemsDone ? "default" : "secondary"}
          className={allItemsDone ? "bg-green-600" : ""}
        >
          {allItemsDone ? "Completed" : "In Progress"}
        </Badge>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {item.qty}x {item.productName}
                </p>
                <Badge
                  className={`text-xs ${statusColors[item.status]}`}
                  variant="default"
                >
                  {item.status}
                </Badge>
              </div>
              {item.status !== "DONE" && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleUpdateStatus(item, getNextStatus(item.status))
                  }
                  disabled={mutation.isPending}
                >
                  {getNextStatus(item.status) === "PREPPING"
                    ? "Prep"
                    : "Done"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <div className="p-4 pt-0 text-xs text-muted-foreground text-center">
        {formatDate(order.sale.createdAt)}
      </div>
    </Card>
  );
};

export default Kitchen;

