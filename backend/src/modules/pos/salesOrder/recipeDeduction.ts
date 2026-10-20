import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";

export interface ResolvedDeduction {
  productId: number;
  productName: string;
  quantity: number;
  currentStock: number;
  unitLabel?: string | null;
  path: string[]; // e.g. ["Cappuccino", "Espresso", "Ground Coffee"]
}

/**
 * Recursively resolves a product into its base ingredients or deducts the product itself if it has no recipe.
 * For formula products:
 * - If on-hand pre-made stock exists at the specified facility, it is used first up to the ordered quantity.
 * - Any remaining quantity (or all of it if stock is 0) is made from recipe ingredients recursively at that facility.
 * Accumulates all leaf ingredients (or ingredients without recipes) into a map of productId -> deduction.
 */
export async function resolveProductDeductions(
  productId: number,
  quantityToOrder: number,
  facilityId?: number | null,
  tx: any = prisma,
  visitedChain: number[] = [],
  stockTracker: Map<number, number> = new Map()
): Promise<Map<number, ResolvedDeduction>> {
  if (visitedChain.includes(productId)) {
    throw AppError.badRequest(`Circular recipe loop detected involving product ID ${productId}`);
  }

  const deductions = new Map<number, ResolvedDeduction>();

  const currentProduct = await tx.product.findFirst({
    where: { id: productId, deletedAt: null },
    include: {
      storageStocks: facilityId ? { where: { facilityId } } : undefined,
      recipes: {
        where: { deletedAt: null },
        include: {
          ingredient: {
            select: {
              id: true,
              productName: true,
              currentStock: true,
              unitLabel: true,
              storageStocks: facilityId ? { where: { facilityId } } : undefined,
            },
          },
        },
      },
    },
  });

  if (!currentProduct) {
    throw AppError.notFound(`Product with ID ${productId} not found.`);
  }

  let productStockAvailable = 0;
  if (facilityId) {
    const facilityStocks = currentProduct.storageStocks || [];
    productStockAvailable = facilityStocks.reduce((sum: number, s: any) => sum + Number(s.stock ?? 0), 0);
  } else {
    productStockAvailable = Number(currentProduct.currentStock ?? 0);
  }

  const availablePreMadeStock = Math.max(
    0,
    stockTracker.has(productId) ? stockTracker.get(productId)! : productStockAvailable
  );

  // If this product has no active recipes, it is directly deducted
  if (!currentProduct.recipes || currentProduct.recipes.length === 0) {
    deductions.set(productId, {
      productId: currentProduct.id,
      productName: currentProduct.productName,
      quantity: quantityToOrder,
      currentStock: availablePreMadeStock,
      unitLabel: currentProduct.unitLabel,
      path: [currentProduct.productName],
    });
    stockTracker.set(productId, availablePreMadeStock - quantityToOrder);
    return deductions;
  }

  // If this product has a recipe:
  // 1. Consume any pre-made finished stock at this facility first
  const fromStock = Math.min(availablePreMadeStock, quantityToOrder);
  const remainingToProduce = quantityToOrder - fromStock;

  if (fromStock > 0) {
    deductions.set(productId, {
      productId: currentProduct.id,
      productName: currentProduct.productName,
      quantity: fromStock,
      currentStock: availablePreMadeStock,
      unitLabel: currentProduct.unitLabel,
      path: [currentProduct.productName],
    });
    stockTracker.set(productId, availablePreMadeStock - fromStock);
  }

  // 2. If additional units are needed (or pre-made stock is 0), resolve ingredients recursively for this facility
  if (remainingToProduce > 0) {
    const nextChain = [...visitedChain, productId];
    for (const recipeItem of currentProduct.recipes) {
      const ingredientQtyNeeded = Number(recipeItem.quantity) * remainingToProduce;
      const subDeductions = await resolveProductDeductions(
        recipeItem.ingredientProductId,
        ingredientQtyNeeded,
        facilityId,
        tx,
        nextChain,
        stockTracker
      );

      for (const [subId, subDed] of subDeductions.entries()) {
        if (deductions.has(subId)) {
          const existing = deductions.get(subId)!;
          existing.quantity += subDed.quantity;
        } else {
          deductions.set(subId, {
            ...subDed,
            path: [currentProduct.productName, ...subDed.path],
          });
        }
      }
    }
  }

  return deductions;
}

/**
 * Calculates how many units of a formula product can be made given current stock of ingredients at a facility.
 */
export function computeProducibleQuantity(recipes: any[] | undefined, facilityId?: number | null): number {
  if (!recipes || recipes.length === 0) return 0;
  let minMakeable = Infinity;
  for (const r of recipes) {
    const qtyNeeded = Number(r.quantity);
    if (qtyNeeded <= 0) continue;

    let avail = 0;
    if (facilityId) {
      const storageStocks = (r.ingredient as any)?.storageStocks || [];
      const facilityStocks = storageStocks.filter((s: any) => s.facilityId === facilityId);
      avail = facilityStocks.reduce((sum: number, s: any) => sum + Number(s.stock ?? 0), 0);
    } else {
      avail = Number(r.ingredient?.currentStock ?? 0);
    }

    const makeable = Math.floor(avail / qtyNeeded);
    if (makeable < minMakeable) {
      minMakeable = makeable;
    }
  }
  return minMakeable === Infinity ? 0 : Math.max(0, minMakeable);
}

/**
 * Validates stock sufficiency for a collection of ordered items by resolving all recipes.
 * Aggregates all required ingredient quantities across all order lines for a specific facility.
 * Throws AppError.badRequest if any ingredient has insufficient stock at that facility.
 */
export async function validateStockSufficiency(
  items: Array<{ productId: number; quantity: number | any }>,
  facilityId?: number | null,
  tx: any = prisma
): Promise<Map<number, ResolvedDeduction>> {
  const aggregatedDeductions = new Map<number, ResolvedDeduction>();
  const stockTracker = new Map<number, number>();

  for (const item of items) {
    const itemDeductions = await resolveProductDeductions(
      item.productId,
      Number(item.quantity),
      facilityId,
      tx,
      [],
      stockTracker
    );
    for (const [prodId, ded] of itemDeductions.entries()) {
      if (aggregatedDeductions.has(prodId)) {
        const existing = aggregatedDeductions.get(prodId)!;
        existing.quantity += ded.quantity;
      } else {
        aggregatedDeductions.set(prodId, { ...ded });
      }
    }
  }

  // Validate all aggregated deductions against currentStock at this facility
  for (const ded of aggregatedDeductions.values()) {
    if (ded.currentStock < ded.quantity) {
      const unit = ded.unitLabel ? ` ${ded.unitLabel}` : "";
      const pathInfo = ded.path.length > 1 ? ` (used by ${ded.path.slice(0, -1).join(" -> ")})` : "";
      const facilityInfo = facilityId ? ` at facility #${facilityId}` : "";
      throw AppError.badRequest(
        `Insufficient stock for '${ded.productName}'${pathInfo}${facilityInfo}. Available stock: ${ded.currentStock}${unit}, Required: ${ded.quantity}${unit}`
      );
    }
  }

  return aggregatedDeductions;
}
