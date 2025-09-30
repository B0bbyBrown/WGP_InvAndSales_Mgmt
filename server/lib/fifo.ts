import { type IStorage } from "../storage";
import { type InventoryLot } from "@shared/schema";

export interface FIFOConsumption {
  lotId: string;
  consumed: number;
  unitCost: number;
}

export interface FIFOResult {
  totalCost: number;
  consumptions: FIFOConsumption[];
}

export async function consumeFIFO(
  storage: IStorage,
  ingredientId: string,
  requiredQty: number
): Promise<FIFOResult> {
  const lots = await storage.getInventoryLots(ingredientId);
  const availableLots = lots.filter(lot => parseFloat(lot.quantity) > 0);
  
  // Check if we have enough total stock
  const totalAvailable = availableLots.reduce((sum, lot) => sum + parseFloat(lot.quantity), 0);
  if (totalAvailable < requiredQty) {
    throw new Error(`Insufficient stock. Required: ${requiredQty}, Available: ${totalAvailable}`);
  }

  let remaining = requiredQty;
  let totalCost = 0;
  const consumptions: FIFOConsumption[] = [];

  // Consume from oldest lots first (FIFO)
  for (const lot of availableLots) {
    if (remaining <= 0) break;

    const lotQuantity = parseFloat(lot.quantity);
    const consumed = Math.min(remaining, lotQuantity);
    const unitCost = parseFloat(lot.unitCost);
    
    consumptions.push({
      lotId: lot.id,
      consumed,
      unitCost,
    });

    totalCost += consumed * unitCost;
    remaining -= consumed;

    // Update the lot quantity
    const newQuantity = lotQuantity - consumed;
    await storage.updateInventoryLot(lot.id, {
      quantity: newQuantity.toString(),
    });
  }

  return {
    totalCost,
    consumptions,
  };
}

export function calculateGrossMargin(revenue: number, cogs: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cogs) / revenue) * 100;
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function formatPercentage(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(1)}%`;
}
