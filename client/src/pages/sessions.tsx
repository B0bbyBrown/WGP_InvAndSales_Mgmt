import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Coins,
  Play,
  Square,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getActiveCashSession,
  getCashSessions,
  openCashSession,
  closeCashSession,
  getSales,
  getItems,
} from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/format";

export default function Sessions() {
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [openingFloat, setOpeningFloat] = useState("");
  const [closingFloat, setClosingFloat] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [inventorySnapshots, setInventorySnapshots] = useState<
    Record<string, string>
  >({});

  const { toast } = useToast();

  const { data: activeSession, refetch: refetchActiveSession } = useQuery({
    queryKey: ["/api/sessions/active"],
    queryFn: () => getActiveCashSession(),
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/sessions"],
    queryFn: () => getCashSessions(),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["/api/items"],
    queryFn: getItems,
  });
  const rawItems = allItems.filter((item) => item.type === "RAW");

  const { data: todaySales = [] } = useQuery({
    queryKey: ["/api/sales", "today"],
    queryFn: () => {
      const today = new Date().toISOString().split("T")[0];
      return getSales(today, today);
    },
  });

  const openSessionMutation = useMutation({
    mutationFn: openCashSession,
    onMutate: async (newSession) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/sessions/active"] });
      await queryClient.cancelQueries({ queryKey: ["/api/sessions"] });

      // Snapshot the previous value
      const previousSession = queryClient.getQueryData([
        "/api/sessions/active",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/sessions/active"], {
        id: "temp-id",
        openedAt: new Date().toISOString(),
        openingFloat: newSession.openingFloat,
        notes: newSession.notes,
      });

      // Return a context object with the snapshotted value
      return { previousSession };
    },
    onSuccess: (data) => {
      toast({
        title: "Session Opened",
        description: "Cash session started successfully",
      });
      // Update queries with the actual data
      queryClient.setQueryData(["/api/sessions/active"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setIsOpenDialogOpen(false);
      setOpeningFloat("");
      setInventorySnapshots({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open session",
        variant: "destructive",
      });
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: any }) =>
      closeCashSession(sessionId, data),
    onMutate: async ({ sessionId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/sessions/active"] });
      await queryClient.cancelQueries({ queryKey: ["/api/sessions"] });

      // Snapshot the previous values
      const previousSession = queryClient.getQueryData([
        "/api/sessions/active",
      ]);
      const previousSessions = queryClient.getQueryData(["/api/sessions"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["/api/sessions/active"], null);
      if (previousSession) {
        queryClient.setQueryData(["/api/sessions"], (old: any[]) => {
          const updated = old.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  closedAt: new Date().toISOString(),
                  closingFloat: data.closingFloat,
                  notes: data.notes,
                }
              : session
          );
          return updated;
        });
      }

      // Return a context object with the snapshotted values
      return { previousSession, previousSessions };
    },
    onSuccess: () => {
      toast({
        title: "Session Closed",
        description: "Cash session closed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setIsCloseDialogOpen(false);
      setClosingFloat("");
      setCloseNotes("");
      setInventorySnapshots({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close session",
        variant: "destructive",
      });
    },
  });

  const handleOpenSession = () => {
    console.log("Current state:", {
      activeSession,
      openingFloat,
      inventorySnapshots,
      rawItems,
    });

    if (activeSession) {
      toast({
        title: "Error",
        description: "Please close the active session before opening a new one",
        variant: "destructive",
      });
      return;
    }

    if (!openingFloat) {
      toast({
        title: "Error",
        description: "Please enter the opening float amount",
        variant: "destructive",
      });
      return;
    }

    if (!rawItems || rawItems.length === 0) {
      toast({
        title: "Error",
        description: "No raw items available. Please add items first.",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty inventory entries
    const inventory = rawItems
      .map((item) => ({
        itemId: item.id,
        quantity: inventorySnapshots[item.id] || "",
      }))
      .filter((item) => item.quantity !== "");

    if (inventory.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one inventory count",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      openingFloat: parseFloat(openingFloat),
      notes: "Session opened",
      inventory,
    };

    console.log("Opening session with payload:", payload);
    openSessionMutation.mutate(payload);
  };

  const handleCloseSession = () => {
    if (!activeSession) return;

    if (!closingFloat) {
      toast({
        title: "Error",
        description: "Please enter the closing float amount",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty inventory entries
    const inventory = rawItems
      .map((item) => ({
        itemId: item.id,
        quantity: inventorySnapshots[item.id] || "",
      }))
      .filter((item) => item.quantity !== "");

    if (inventory.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one inventory count",
        variant: "destructive",
      });
      return;
    }

    closeSessionMutation.mutate({
      sessionId: activeSession.id,
      data: {
        closingFloat,
        notes: closeNotes || "Session closed",
        inventory,
      },
    });
  };

  const handleSnapshotChange = (itemId: string, value: string) => {
    setInventorySnapshots((prev) => ({ ...prev, [itemId]: value }));
  };

  const calculateSessionStats = (session: any) => {
    const sessionSales = todaySales.filter(
      (sale: any) => sale.sessionId === session.id
    );
    const cashSales = sessionSales.filter(
      (sale: any) => sale.paymentType === "CASH"
    );
    const cardSales = sessionSales.filter(
      (sale: any) => sale.paymentType === "CARD"
    );

    const totalSales = sessionSales.reduce(
      (sum: number, sale: any) => sum + parseFloat(sale.total),
      0
    );
    const cashTotal = cashSales.reduce(
      (sum: number, sale: any) => sum + parseFloat(sale.total),
      0
    );
    const cardTotal = cardSales.reduce(
      (sum: number, sale: any) => sum + parseFloat(sale.total),
      0
    );

    return {
      totalSales,
      cashTotal,
      cardTotal,
      salesCount: sessionSales.length,
    };
  };

  const getExpectedCash = (session: any) => {
    const stats = calculateSessionStats(session);
    return parseFloat(session.openingFloat) + stats.cashTotal;
  };

  const getVariance = (session: any) => {
    if (!session.closingFloat) return 0;
    const expected = getExpectedCash(session);
    const actual =
      typeof session.closingFloat === "string"
        ? parseFloat(session.closingFloat)
        : session.closingFloat;
    return actual - expected;
  };

  return (
    <Layout
      title="Cash Sessions"
      description="Manage cash drawer sessions and reconcile daily sales"
    >
      {/* Session Control */}
      <Card className="mb-6" data-testid="session-control-card">
        <CardHeader>
          <CardTitle>Session Control</CardTitle>
        </CardHeader>
        <CardContent>
          {activeSession ? (
            <div className="space-y-4" data-testid="active-session-info">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-green-800">
                      Session Active
                    </h3>
                    <p className="text-sm text-green-600">
                      Started: {formatDate(activeSession.openedAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600">Opening Float</p>
                  <p
                    className="font-semibold text-green-800"
                    data-testid="opening-float"
                  >
                    {formatCurrency(activeSession.openingFloat)}
                  </p>
                </div>
              </div>

              {/* Session Statistics */}
              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                data-testid="session-stats"
              >
                {(() => {
                  const stats = calculateSessionStats(activeSession);
                  return (
                    <>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Sales
                              </p>
                              <p className="text-xl font-bold">
                                {formatCurrency(stats.totalSales)}
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Cash Sales
                              </p>
                              <p className="text-xl font-bold">
                                {formatCurrency(stats.cashTotal)}
                              </p>
                            </div>
                            <Coins className="h-8 w-8 text-orange-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Card Sales
                              </p>
                              <p className="text-xl font-bold">
                                {formatCurrency(stats.cardTotal)}
                              </p>
                            </div>
                            <CreditCard className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>

              {/* Expected Cash */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-800">
                      Expected Cash in Drawer:
                    </span>
                    <span
                      className="text-xl font-bold text-blue-800"
                      data-testid="expected-cash"
                    >
                      {formatCurrency(getExpectedCash(activeSession))}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Opening Float + Cash Sales
                  </p>
                </CardContent>
              </Card>

              <Dialog
                open={isCloseDialogOpen}
                onOpenChange={setIsCloseDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    className="w-full"
                    variant="destructive"
                    data-testid="close-session-button"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Close Session
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="close-session-dialog">
                  <DialogHeader>
                    <DialogTitle>Close Cash Session</DialogTitle>
                    <DialogDescription>
                      Confirm the final cash count and enter closing inventory
                      levels to close out the session.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Expected Cash in Drawer</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <span className="text-lg font-semibold">
                          {formatCurrency(getExpectedCash(activeSession))}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="closingFloat">Actual Cash Count *</Label>
                      <Input
                        id="closingFloat"
                        type="number"
                        step="0.01"
                        min="0"
                        value={closingFloat}
                        onChange={(e) => setClosingFloat(e.target.value)}
                        placeholder="0.00"
                        data-testid="closing-float-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="closeNotes">Notes (optional)</Label>
                      <Textarea
                        id="closeNotes"
                        value={closeNotes}
                        onChange={(e) => setCloseNotes(e.target.value)}
                        placeholder="Session closing notes..."
                        data-testid="close-notes-input"
                      />
                    </div>

                    <h4 className="font-medium">Closing Inventory Count</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                      {rawItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-3 gap-2 items-center"
                        >
                          <Label
                            htmlFor={`close-item-${item.id}`}
                            className="col-span-2"
                          >
                            {item.name}
                          </Label>
                          <Input
                            id={`close-item-${item.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={inventorySnapshots[item.id] || ""}
                            onChange={(e) =>
                              handleSnapshotChange(
                                item.id,
                                e.target.value
                              )
                            }
                            placeholder={item.unit}
                          />
                        </div>
                      ))}
                    </div>

                    {closingFloat && (
                      <Card
                        className={
                          getVariance({ ...activeSession, closingFloat }) >= 0
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Variance:</span>
                            <span
                              className={`font-bold ${
                                getVariance({
                                  ...activeSession,
                                  closingFloat,
                                }) >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {getVariance({
                                ...activeSession,
                                closingFloat,
                              }) >= 0
                                ? "+"
                                : ""}
                              {formatCurrency(
                                getVariance({ ...activeSession, closingFloat })
                              )}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <Button
                      onClick={handleCloseSession}
                      disabled={closeSessionMutation.isPending}
                      className="w-full relative"
                      variant="destructive"
                      data-testid="confirm-close-session-button"
                    >
                      {closeSessionMutation.isPending && (
                        <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                          <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {closeSessionMutation.isPending
                        ? "Closing..."
                        : "Close Session"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4" data-testid="no-active-session">
              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-red-800">
                      {activeSession
                        ? "Active Session Exists"
                        : "No Active Session"}
                    </h3>
                    <p className="text-sm text-red-600">
                      {activeSession
                        ? "Close the active session before opening a new one"
                        : "Open a session to track cash transactions"}
                    </p>
                  </div>
                </div>
              </div>

              {activeSession ? (
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => setIsCloseDialogOpen(true)}
                  data-testid="close-active-session-button"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Close Active Session First
                </Button>
              ) : (
                <Dialog
                  open={isOpenDialogOpen}
                  onOpenChange={setIsOpenDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      data-testid="open-session-button"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Open Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="open-session-dialog">
                    <DialogHeader>
                      <DialogTitle>Open Cash Session</DialogTitle>
                      <DialogDescription>
                        Enter the starting cash float and opening inventory
                        levels to begin a new session.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="openingFloat">Opening Float *</Label>
                        <Input
                          id="openingFloat"
                          type="number"
                          step="0.01"
                          min="0"
                          value={openingFloat}
                          onChange={(e) => setOpeningFloat(e.target.value)}
                          placeholder="200.00"
                          data-testid="opening-float-input"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Amount of cash in drawer to start the session
                        </p>
                      </div>

                      <h4 className="font-medium">Opening Inventory Count</h4>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                        {rawItems.map((item: any) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-3 gap-2 items-center"
                          >
                            <Label
                              htmlFor={`item-${item.id}`}
                              className="col-span-2"
                            >
                              {item.name}
                            </Label>
                            <Input
                              id={`item-${item.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={inventorySnapshots[item.id] || ""}
                              onChange={(e) =>
                                handleSnapshotChange(
                                  item.id,
                                  e.target.value
                                )
                              }
                              placeholder={item.unit}
                            />
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={handleOpenSession}
                        disabled={openSessionMutation.isPending}
                        className="w-full relative"
                        data-testid="confirm-open-session-button"
                      >
                        {openSessionMutation.isPending && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                        {openSessionMutation.isPending
                          ? "Opening..."
                          : "Open Session"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      <Card data-testid="session-history-card">
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sessions yet</p>
              <p className="text-sm text-muted-foreground">
                Open your first session to start tracking
              </p>
            </div>
          ) : (
            <Table data-testid="sessions-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Opening Float</TableHead>
                  <TableHead>Sales Total</TableHead>
                  <TableHead>Expected Cash</TableHead>
                  <TableHead>Actual Cash</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: any, index: number) => {
                  const stats = calculateSessionStats(session);
                  const variance = getVariance(session);
                  const isActive = !session.closedAt;

                  return (
                    <TableRow
                      key={session.id}
                      data-testid={`session-row-${index}`}
                    >
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(session.openedAt)}</p>
                          {session.closedAt && (
                            <p className="text-muted-foreground">
                              to {formatDate(session.closedAt)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(session.openingFloat)}
                      </TableCell>
                      <TableCell>{formatCurrency(stats.totalSales)}</TableCell>
                      <TableCell>
                        {formatCurrency(getExpectedCash(session))}
                      </TableCell>
                      <TableCell>
                        {session.closingFloat
                          ? formatCurrency(session.closingFloat)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {session.closedAt && session.closingFloat ? (
                          <span
                            className={
                              variance >= 0 ? "text-green-600" : "text-red-600"
                            }
                          >
                            {variance >= 0 ? "+" : ""}
                            {formatCurrency(variance)}
                            {variance >= 0 ? (
                              <TrendingUp className="inline h-3 w-3 ml-1" />
                            ) : (
                              <TrendingDown className="inline h-3 w-3 ml-1" />
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Active" : "Closed"}
                        </Badge>
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
