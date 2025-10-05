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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
  Receipt,
  Plus,
  CreditCard,
  Wallet,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getExpenses, createExpense } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/format";

export default function Expenses() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expenseLabel, setExpenseLabel] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "OTHER">(
    "CASH"
  );

  const { toast } = useToast();

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: () => getExpenses(),
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record expense",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setExpenseLabel("");
    setExpenseAmount("");
    setPaymentMethod("CASH");
  };

  const handleCreateExpense = () => {
    if (!expenseLabel || !expenseAmount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createExpenseMutation.mutate({
      label: expenseLabel,
      amount: expenseAmount,
      paidVia: paymentMethod,
    });
  };

  const getTotalExpenses = () => {
    return expenses.reduce(
      (total: number, expense: any) => total + parseFloat(expense.amount),
      0
    );
  };

  const getTodayExpenses = () => {
    const today = new Date().toDateString();
    return expenses.filter(
      (expense: any) => new Date(expense.createdAt).toDateString() === today
    );
  };

  const getExpensesByPaymentType = () => {
    const byType = expenses.reduce((acc: any, expense: any) => {
      const type = expense.paidVia;
      if (!acc[type]) {
        acc[type] = { count: 0, total: 0 };
      }
      acc[type].count += 1;
      acc[type].total += parseFloat(expense.amount);
      return acc;
    }, {});

    return byType;
  };

  const expensesByPaymentType = getExpensesByPaymentType();
  const todayExpenses = getTodayExpenses();
  const todayTotal = todayExpenses.reduce(
    (total: number, expense: any) => total + parseFloat(expense.amount),
    0
  );

  const getPaymentIcon = (paymentType: string) => {
    switch (paymentType) {
      case "CASH":
        return <Wallet className="h-4 w-4" />;
      case "CARD":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  return (
    <Layout title="Expenses" description="Track and manage business expenses">
      {/* Action Bar */}
      <div
        className="flex items-center justify-between mb-6"
        data-testid="expenses-actions"
      >
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-expense-button">
              <Plus className="mr-2 h-4 w-4" />
              Record Expense
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="create-expense-dialog">
            <DialogHeader>
              <DialogTitle>Record New Expense</DialogTitle>
              <DialogDescription>
                Fill in the details below to record a new business expense.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Expense Description *</Label>
                <Input
                  id="label"
                  value={expenseLabel}
                  onChange={(e) => setExpenseLabel(e.target.value)}
                  placeholder="e.g. Truck fuel, Supplies, etc."
                  data-testid="expense-label-input"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  data-testid="expense-amount-input"
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: any) => setPaymentMethod(value)}
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
              <Button
                onClick={handleCreateExpense}
                disabled={createExpenseMutation.isPending}
                className="w-full"
                data-testid="confirm-expense-button"
              >
                {createExpenseMutation.isPending
                  ? "Recording..."
                  : "Record Expense"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"
        data-testid="expense-summary-cards"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today's Expenses
                </p>
                <p
                  className="text-2xl font-bold text-foreground"
                  data-testid="today-expenses"
                >
                  {formatCurrency(todayTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayExpenses.length} transactions
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Receipt className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>
                <p
                  className="text-2xl font-bold text-foreground"
                  data-testid="total-expenses"
                >
                  {formatCurrency(getTotalExpenses())}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expenses.length} total transactions
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Cash Expenses
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(expensesByPaymentType.CASH?.total || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expensesByPaymentType.CASH?.count || 0} transactions
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Card Expenses
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(expensesByPaymentType.CARD?.total || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expensesByPaymentType.CARD?.count || 0} transactions
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card data-testid="expenses-list-card">
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No expenses recorded yet</p>
              <p className="text-sm text-muted-foreground">
                Start tracking your business expenses
              </p>
            </div>
          ) : (
            <Table data-testid="expenses-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense: any, index: number) => (
                  <TableRow
                    key={expense.id}
                    data-testid={`expense-row-${index}`}
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                        {formatDate(expense.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell
                      className="font-medium"
                      data-testid={`expense-description-${index}`}
                    >
                      {expense.label}
                    </TableCell>
                    <TableCell
                      className="font-semibold text-red-600"
                      data-testid={`expense-amount-${index}`}
                    >
                      -{formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          expense.paidVia === "CASH"
                            ? "default"
                            : expense.paidVia === "CARD"
                            ? "secondary"
                            : "outline"
                        }
                        className="flex items-center w-fit"
                      >
                        {getPaymentIcon(expense.paidVia)}
                        <span className="ml-2">{expense.paidVia}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {expense.label.toLowerCase().includes("fuel")
                          ? "Transportation"
                          : expense.label.toLowerCase().includes("supply") ||
                            expense.label.toLowerCase().includes("napkin")
                          ? "Supplies"
                          : expense.label.toLowerCase().includes("food") ||
                            expense.label.toLowerCase().includes("ingredient")
                          ? "Food Cost"
                          : "General"}
                      </Badge>
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
