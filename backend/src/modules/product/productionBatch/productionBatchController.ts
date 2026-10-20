import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationMeta } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import { parseRecipeMeta } from "../productRecipe/recipeMeta";
import {
  CreateProductionBatchType,
  ConfirmProductionBatchType,
  CancelProductionBatchType,
  GetProductionBatchQueryType,
  PreviewProductionBatchType,
} from "./productionBatchSchema";

function generateBatchNumber(productSku: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const cleanSku = (productSku || "BATCH").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `BAT-${dateStr}-${cleanSku}-${randomHex}`;
}

/**
 * Preview requirements, material availability, and total cost before committing a batch.
 * If facilityId is provided, checks inventory availability specific to that facility.
 */
export const previewProductionBatchController: TypedHandler<PreviewProductionBatchType> = async (request, reply) => {
  const { productId, quantity, facilityId } = request.body;

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    include: {
      recipes: {
        where: { deletedAt: null },
        include: {
          ingredient: {
            select: {
              id: true,
              productName: true,
              sku: true,
              currentStock: true,
              unitLabel: true,
              productPrice: { where: { deletedAt: null } },
              vendorProducts: { where: { deletedAt: null } },
              storageStocks: facilityId ? { where: { facilityId } } : undefined,
            },
          },
        },
      },
      storageStocks: facilityId ? { where: { facilityId } } : undefined,
    },
  });

  if (!product) throw AppError.notFound("Target product not found");
  if (!product.recipes || product.recipes.length === 0) {
    throw AppError.badRequest("Product has no recipe/BOM defined. Cannot produce batch without a formula.");
  }

  const { meta } = parseRecipeMeta(product.description);

  let materialCost = 0;
  let canProduce = true;

  const items = product.recipes.map((r) => {
    const qtyPerUnit = Number(r.quantity);
    const qtyNeeded = qtyPerUnit * quantity;

    // Determine current stock: facility-specific if requested, else overall currentStock
    const facilityStock = facilityId
      ? (r.ingredient.storageStocks || []).reduce((sum: number, s: any) => sum + Number(s.stock || 0), 0)
      : Number(r.ingredient.currentStock ?? 0);

    const hasEnoughStock = facilityStock >= qtyNeeded;
    if (!hasEnoughStock) canProduce = false;

    const pPrice = r.ingredient.productPrice?.find((p) => p.priceType === "retail") || r.ingredient.productPrice?.[0];
    const vPrice = r.ingredient.vendorProducts?.find((v) => v.vendorPrice !== null) || r.ingredient.vendorProducts?.[0];
    const unitCost = pPrice ? Number(pPrice.amount) : vPrice?.vendorPrice ? Number(vPrice.vendorPrice) : 0;
    const lineCost = qtyNeeded * unitCost;

    materialCost += lineCost;

    return {
      ingredientProductId: r.ingredientProductId,
      productName: r.ingredient.productName,
      sku: r.ingredient.sku,
      unitLabel: r.unitLabel || r.ingredient.unitLabel,
      qtyPerUnit,
      qtyNeeded,
      currentStock: facilityStock,
      hasEnoughStock,
      shortage: hasEnoughStock ? 0 : qtyNeeded - facilityStock,
      unitCost,
      lineCost,
    };
  });

  const laborCost = (meta.labor || []).reduce((sum, l) => sum + ((l.hours || 0) * (l.hourlyRate || 0) * quantity), 0);
  const equipmentCost = (meta.equipment || []).reduce((sum, eq) => sum + ((eq.hours || 0) * (eq.hourlyRate || 0) * quantity), 0);
  const totalCost = materialCost + laborCost + equipmentCost;
  const unitCost = quantity > 0 ? totalCost / quantity : 0;

  const currentProdStock = facilityId
    ? (product.storageStocks || []).reduce((sum: number, s: any) => sum + Number(s.stock || 0), 0)
    : Number(product.currentStock ?? 0);

  return success(reply, {
    product: {
      id: product.id,
      productName: product.productName,
      sku: product.sku,
      unitLabel: product.unitLabel,
      currentStock: currentProdStock,
      targetQuantity: quantity,
      stockAfterProduction: currentProdStock + quantity,
    },
    facilityId: facilityId || null,
    items,
    canProduce,
    costBreakdown: {
      materialCost,
      laborCost,
      equipmentCost,
      totalCost,
      unitCost,
    },
  }, "Production preview generated successfully");
};

/**
 * Plan a production batch (Manager sets facility and person in charge):
 * 1. Validates facility and person in charge (employee).
 * 2. Checks raw material stock at that facility.
 * 3. Creates the productionBatch with status = 'PLANNED' and snapshot of items.
 * Inventory is NOT moved yet; completion and inventory addition happen upon confirmation.
 */
export const createProductionBatchController: TypedHandler<CreateProductionBatchType> = async (request, reply) => {
  const { productId, quantity, facilityId, personInChargeId, notes } = request.body;
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized("Authentication required");

  // Validate facility
  const targetFacility = await prisma.facility.findFirst({
    where: { id: facilityId, deletedAt: null, isActive: true },
  });
  if (!targetFacility) throw AppError.notFound("Target production facility not found or inactive");

  // Validate person in charge (must be an active employee with an application user account)
  const targetEmployee = await prisma.employee.findFirst({
    where: { id: personInChargeId, deletedAt: null },
    include: {
      profile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          userProfile: {
            where: { deletedAt: null },
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
  if (!targetEmployee) throw AppError.notFound("Assigned person in charge (employee) not found");

  const picUsers = targetEmployee.profile?.userProfile || [];
  if (picUsers.length === 0) {
    const employeeName = targetEmployee.profile
      ? `${targetEmployee.profile.firstName || ""} ${targetEmployee.profile.lastName || ""}`.trim()
      : `Employee #${targetEmployee.id}`;
    throw AppError.badRequest(
      `Assigned person in charge (${employeeName}) does not have an app user account. The person in charge must have an account to log in and confirm production.`
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    include: {
      recipes: {
        where: { deletedAt: null },
        include: {
          ingredient: {
            select: {
              id: true,
              productName: true,
              sku: true,
              currentStock: true,
              unitLabel: true,
              productPrice: { where: { deletedAt: null } },
              vendorProducts: { where: { deletedAt: null } },
              storageStocks: { where: { facilityId } },
            },
          },
        },
      },
    },
  });

  if (!product) throw AppError.notFound("Target product not found");
  if (!product.recipes || product.recipes.length === 0) {
    throw AppError.badRequest("Product has no recipe/BOM defined. Cannot produce batch without a formula.");
  }

  // Check ingredient availability at this facility
  for (const r of product.recipes) {
    const qtyNeeded = Number(r.quantity) * quantity;
    const facilityStock = (r.ingredient.storageStocks || []).reduce(
      (sum: number, s: any) => sum + Number(s.stock || 0),
      0
    );

    if (facilityStock < qtyNeeded) {
      throw AppError.badRequest(
        `Insufficient stock for '${r.ingredient.productName}' at ${targetFacility.facilityName}. Required: ${qtyNeeded} ${r.unitLabel || ""}, Available: ${facilityStock} ${r.unitLabel || ""}`
      );
    }
  }

  const { meta } = parseRecipeMeta(product.description);
  const batchNumber = generateBatchNumber(product.sku);
  const now = new Date();

  let materialCost = 0;
  const batchItemData: Array<{
    ingredientProductId: number;
    quantityPerUnit: number;
    quantityConsumed: number;
    unitLabel?: string | null;
    unitCost: number;
    lineCost: number;
  }> = [];

  for (const r of product.recipes) {
    const qtyPerUnit = Number(r.quantity);
    const qtyConsumed = qtyPerUnit * quantity;

    const pPrice = r.ingredient.productPrice?.find((p) => p.priceType === "retail") || r.ingredient.productPrice?.[0];
    const vPrice = r.ingredient.vendorProducts?.find((v) => v.vendorPrice !== null) || r.ingredient.vendorProducts?.[0];
    const unitCost = pPrice ? Number(pPrice.amount) : vPrice?.vendorPrice ? Number(vPrice.vendorPrice) : 0;
    const lineCost = qtyConsumed * unitCost;
    materialCost += lineCost;

    batchItemData.push({
      ingredientProductId: r.ingredientProductId,
      quantityPerUnit: qtyPerUnit,
      quantityConsumed: qtyConsumed,
      unitLabel: r.unitLabel || r.ingredient.unitLabel,
      unitCost,
      lineCost,
    });
  }

  const laborCost = (meta.labor || []).reduce((sum, l) => sum + ((l.hours || 0) * (l.hourlyRate || 0) * quantity), 0);
  const equipmentCost = (meta.equipment || []).reduce((sum, eq) => sum + ((eq.hours || 0) * (eq.hourlyRate || 0) * quantity), 0);
  const totalCost = materialCost + laborCost + equipmentCost;
  const unitCost = quantity > 0 ? totalCost / quantity : 0;

  const plannedBatch = await prisma.productionBatch.create({
    data: {
      batchNumber,
      productId: product.id,
      facilityId,
      personInChargeId,
      quantity,
      unitLabel: product.unitLabel,
      status: "PLANNED",
      materialCost,
      laborCost,
      equipmentCost,
      totalCost,
      unitCost,
      notes,
      createdAt: now,
      createdBy: user.id,
      items: {
        create: batchItemData,
      },
    },
    include: {
      product: { select: { id: true, productName: true, sku: true, currentStock: true, unitLabel: true } },
      facility: { select: { id: true, facilityName: true, facilityCode: true } },
      personInCharge: {
        select: {
          id: true,
          profile: { select: { id: true, firstName: true, lastName: true } },
          position: { select: { id: true, name: true } },
        },
      },
      items: {
        include: {
          ingredient: { select: { id: true, productName: true, sku: true, unitLabel: true } },
        },
      },
    },
  });

  const employeeName = targetEmployee.profile
    ? `${targetEmployee.profile.firstName || ""} ${targetEmployee.profile.lastName || ""}`.trim()
    : `Employee #${targetEmployee.id}`;

  return created(
    reply,
    plannedBatch,
    `Production work order ${plannedBatch.batchNumber} scheduled at ${targetFacility.facilityName}. Assigned to ${employeeName}.`
  );
};

/**
 * Confirm Production Batch Completion:
 * Triggered by the person in charge when production is finished.
 * 1. Checks that the user is the person in charge (or manager/admin).
 * 2. In atomic transaction:
 *    - Deducts ingredients from the facility's productStorageStock (and product.currentStock, inventory OUT log).
 *    - Adds finished product to the facility's productStorageStock (and product.currentStock, inventory IN log).
 *    - Updates batch status to 'COMPLETED', sets producedAt, confirmedAt, confirmedBy.
 */
export const confirmProductionBatchController: TypedHandler<ConfirmProductionBatchType> = async (request, reply) => {
  const { id, notes } = request.body;
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized("Authentication required");

  const batch = await prisma.productionBatch.findFirst({
    where: { id, deletedAt: null },
    include: {
      product: true,
      facility: true,
      personInCharge: {
        include: {
          profile: {
            include: {
              userProfile: true,
            },
          },
        },
      },
      items: {
        include: {
          ingredient: {
            include: {
              storageStocks: true,
            },
          },
        },
      },
    },
  });

  if (!batch) throw AppError.notFound("Production batch not found");
  if (batch.status === "COMPLETED") {
    throw AppError.badRequest(`Batch ${batch.batchNumber} has already been completed and confirmed`);
  }
  if (batch.status === "CANCELLED") {
    throw AppError.badRequest(`Batch ${batch.batchNumber} is cancelled and cannot be confirmed`);
  }
  if (!batch.facilityId) {
    throw AppError.badRequest("Batch does not have an assigned facility");
  }

  const facilityId = batch.facilityId;

  // Authorization check: User must be:
  // 1. Super admin
  // 2. The creator of the batch (batch.createdBy === user.id)
  // 3. The designated person in charge (user matches batch.personInCharge)
  const isSuperAdmin = Boolean(user.isSuperAdmin);
  const isCreator = Boolean(batch.createdBy && batch.createdBy === user.id);
  const isPersonInCharge = Boolean(
    batch.personInCharge?.profile?.userProfile?.some((u: any) => u.id === user.id) ||
    batch.personInCharge?.profileId === user.profileId
  );

  if (!isSuperAdmin && !isCreator && !isPersonInCharge) {
    const assignedName = batch.personInCharge?.profile
      ? `${batch.personInCharge.profile.firstName || ""} ${batch.personInCharge.profile.lastName || ""}`.trim()
      : `Employee #${batch.personInChargeId || "N/A"}`;
    throw AppError.forbidden(
      `Only the person who created this batch or the assigned person in charge (${assignedName}) can confirm its completion.`
    );
  }

  const now = new Date();
  const quantityToProduce = Number(batch.quantity);

  // Re-verify ingredient stock at facility before committing
  for (const item of batch.items) {
    const qtyNeeded = Number(item.quantityConsumed);
    const facilityStorage = item.ingredient.storageStocks.find((s: any) => s.facilityId === facilityId);
    const availableAtFacility = Number(facilityStorage?.stock ?? 0);

    if (availableAtFacility < qtyNeeded) {
      throw AppError.badRequest(
        `Insufficient stock at ${batch.facility?.facilityName || "facility"} for '${item.ingredient.productName}'. Required: ${qtyNeeded} ${item.unitLabel || ""}, Available: ${availableAtFacility} ${item.unitLabel || ""}`
      );
    }
  }

  // Atomic completion transaction
  const completedBatch = await prisma.$transaction(async (tx) => {
    // 1. Deduct raw materials from the specific facility
    for (const item of batch.items) {
      const qtyConsumed = Number(item.quantityConsumed);

      // A. Decrement facility-specific storage stock
      const existingFacilityStock = await tx.productStorageStock.findFirst({
        where: { productId: item.ingredientProductId, facilityId },
      });

      const newFacilityStockVal = Number(existingFacilityStock?.stock ?? 0) - qtyConsumed;

      if (existingFacilityStock) {
        await tx.productStorageStock.update({
          where: { id: existingFacilityStock.id },
          data: { stock: newFacilityStockVal, updatedAt: now },
        });
      } else {
        await tx.productStorageStock.create({
          data: {
            productId: item.ingredientProductId,
            facilityId,
            stock: -qtyConsumed,
            createdAt: now,
            updatedAt: now,
          },
        });
      }

      // B. Decrement master product currentStock
      const productRecord = await tx.product.findUnique({
        where: { id: item.ingredientProductId },
      });
      const newGlobalStock = Number(productRecord?.currentStock ?? 0) - qtyConsumed;
      await tx.product.update({
        where: { id: item.ingredientProductId },
        data: { currentStock: newGlobalStock, updatedAt: now, updatedBy: user.id },
      });

      // C. Write inventory OUT transaction
      await tx.productInventory.create({
        data: {
          productId: item.ingredientProductId,
          facilityId,
          transactionType: "OUT",
          quantity: qtyConsumed,
          reference: batch.batchNumber,
          notes: `Production Completed [${batch.batchNumber}]: Consumed at ${batch.facility?.facilityName || `Facility #${facilityId}`}`,
          currentStock: newFacilityStockVal,
          transactionDate: now,
          createdAt: now,
          updatedAt: now,
          createdBy: user.id,
          updatedBy: user.id,
        },
      });
    }

    // 2. Add finished produced goods to facility
    const existingProdFacilityStock = await tx.productStorageStock.findFirst({
      where: { productId: batch.productId, facilityId },
    });

    const newProdFacilityStockVal = Number(existingProdFacilityStock?.stock ?? 0) + quantityToProduce;

    if (existingProdFacilityStock) {
      await tx.productStorageStock.update({
        where: { id: existingProdFacilityStock.id },
        data: { stock: newProdFacilityStockVal, updatedAt: now },
      });
    } else {
      await tx.productStorageStock.create({
        data: {
          productId: batch.productId,
          facilityId,
          stock: quantityToProduce,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    // Master product currentStock addition
    const masterFinishedProd = await tx.product.findUnique({
      where: { id: batch.productId },
    });
    const newGlobalFinishedStock = Number(masterFinishedProd?.currentStock ?? 0) + quantityToProduce;

    await tx.product.update({
      where: { id: batch.productId },
      data: { currentStock: newGlobalFinishedStock, updatedAt: now, updatedBy: user.id },
    });

    // Write inventory IN transaction
    await tx.productInventory.create({
      data: {
        productId: batch.productId,
        facilityId,
        transactionType: "IN",
        quantity: quantityToProduce,
        reference: batch.batchNumber,
        notes: `Production Completed [${batch.batchNumber}]: Added to ${batch.facility?.facilityName || `Facility #${facilityId}`}`,
        currentStock: newProdFacilityStockVal,
        transactionDate: now,
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    // 3. Mark batch as COMPLETED
    const updated = await tx.productionBatch.update({
      where: { id: batch.id },
      data: {
        status: "COMPLETED",
        producedAt: now,
        confirmedAt: now,
        confirmedBy: user.id,
        notes: notes ? (batch.notes ? `${batch.notes}\nCompletion Notes: ${notes}` : notes) : batch.notes,
        updatedAt: now,
        updatedBy: user.id,
      },
      include: {
        product: { select: { id: true, productName: true, sku: true, currentStock: true, unitLabel: true } },
        facility: { select: { id: true, facilityName: true, facilityCode: true } },
        personInCharge: {
          select: {
            id: true,
            profile: { select: { id: true, firstName: true, lastName: true } },
            position: { select: { id: true, name: true } },
          },
        },
        confirmedByUser: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            ingredient: { select: { id: true, productName: true, sku: true, unitLabel: true } },
          },
        },
      },
    });

    return updated;
  });

  return success(
    reply,
    completedBatch,
    `Production batch ${completedBatch.batchNumber} confirmed completed. ${quantityToProduce} ${completedBatch.unitLabel || "units"} added to ${completedBatch.facility?.facilityName} inventory.`
  );
};

/**
 * Cancel/Rollback a production batch:
 * If the batch was COMPLETED: reverses the inventory movements at the facility.
 * If the batch was PLANNED: simply marks as CANCELLED without needing to reverse inventory.
 */
export const cancelProductionBatchController: TypedHandler<CancelProductionBatchType> = async (request, reply) => {
  const { id, reason } = request.body;
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized("Authentication required");

  const batch = await prisma.productionBatch.findFirst({
    where: { id, deletedAt: null },
    include: {
      product: {
        include: {
          storageStocks: true,
        },
      },
      facility: true,
      items: {
        include: {
          ingredient: {
            include: {
              storageStocks: true,
            },
          },
        },
      },
    },
  });

  if (!batch) throw AppError.notFound("Production batch not found");
  if (batch.status === "CANCELLED") {
    throw AppError.badRequest("Production batch is already cancelled");
  }

  const now = new Date();
  const facilityId = batch.facilityId;

  // Case 1: Batch was PLANNED or IN_PROGRESS (no stock was moved yet)
  if (batch.status !== "COMPLETED") {
    const cancelled = await prisma.productionBatch.update({
      where: { id: batch.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelReason: reason || null,
        updatedAt: now,
        updatedBy: user.id,
      },
      include: {
        product: { select: { id: true, productName: true, sku: true, currentStock: true } },
        facility: { select: { id: true, facilityName: true, facilityCode: true } },
        items: true,
      },
    });

    return success(reply, cancelled, `Production batch ${batch.batchNumber} cancelled.`);
  }

  // Case 2: Batch was COMPLETED (reverses inventory movements)
  const batchQty = Number(batch.quantity);

  // Check finished stock sufficiency to rollback
  const facilityStockRecord = facilityId
    ? batch.product.storageStocks.find((s) => s.facilityId === facilityId)
    : null;
  const availableFinishedStock = facilityStockRecord
    ? Number(facilityStockRecord.stock)
    : Number(batch.product.currentStock ?? 0);

  if (availableFinishedStock < batchQty) {
    throw AppError.badRequest(
      `Cannot cancel completed batch. Finished product '${batch.product.productName}' has only ${availableFinishedStock} in stock at this facility (requires ${batchQty} to reverse). Some items may have already been sold.`
    );
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    // 1. Deduct finished product
    if (facilityId && facilityStockRecord) {
      const newFacStock = availableFinishedStock - batchQty;
      await tx.productStorageStock.update({
        where: { id: facilityStockRecord.id },
        data: { stock: newFacStock, updatedAt: now },
      });
    }

    const currentGlobalStock = Number(batch.product.currentStock ?? 0);
    const newGlobalStock = currentGlobalStock - batchQty;
    await tx.product.update({
      where: { id: batch.productId },
      data: { currentStock: newGlobalStock, updatedAt: now, updatedBy: user.id },
    });

    await tx.productInventory.create({
      data: {
        productId: batch.productId,
        facilityId: facilityId || undefined,
        transactionType: "OUT",
        quantity: batchQty,
        reference: `CANCEL-${batch.batchNumber}`,
        notes: `Production Batch Cancelled: Reversed finished goods. Reason: ${reason || "N/A"}`,
        currentStock: newGlobalStock,
        transactionDate: now,
        createdBy: user.id,
      },
    });

    // 2. Return raw materials back to facility
    for (const item of batch.items) {
      const qtyToReturn = Number(item.quantityConsumed);

      if (facilityId) {
        const facStock = await tx.productStorageStock.findFirst({
          where: { productId: item.ingredientProductId, facilityId },
        });
        if (facStock) {
          await tx.productStorageStock.update({
            where: { id: facStock.id },
            data: { stock: Number(facStock.stock) + qtyToReturn, updatedAt: now },
          });
        }
      }

      const ingGlobalStock = Number(item.ingredient.currentStock ?? 0);
      const newIngGlobalStock = ingGlobalStock + qtyToReturn;

      await tx.product.update({
        where: { id: item.ingredientProductId },
        data: { currentStock: newIngGlobalStock, updatedAt: now, updatedBy: user.id },
      });

      await tx.productInventory.create({
        data: {
          productId: item.ingredientProductId,
          facilityId: facilityId || undefined,
          transactionType: "IN",
          quantity: qtyToReturn,
          reference: `CANCEL-${batch.batchNumber}`,
          notes: `Production Batch Cancelled: Returned raw materials. Reason: ${reason || "N/A"}`,
          currentStock: newIngGlobalStock,
          transactionDate: now,
          createdBy: user.id,
        },
      });
    }

    // 3. Mark batch as CANCELLED
    return tx.productionBatch.update({
      where: { id: batch.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelReason: reason || null,
        updatedAt: now,
        updatedBy: user.id,
      },
      include: {
        product: { select: { id: true, productName: true, sku: true, currentStock: true } },
        facility: { select: { id: true, facilityName: true, facilityCode: true } },
        items: true,
      },
    });
  });

  return success(reply, cancelled, "Production batch successfully cancelled. Inventory reversed.");
};

export const getProductionBatchesController: TypedHandler<GetProductionBatchQueryType> = async (request, reply) => {
  const query = request.body || {};
  const { productId, facilityId, personInChargeId, status, search, page = 1, limit = 50 } = query;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (productId) where.productId = productId;
  if (facilityId) where.facilityId = facilityId;
  if (personInChargeId) where.personInChargeId = personInChargeId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { batchNumber: { contains: search, mode: "insensitive" } },
      { product: { productName: { contains: search, mode: "insensitive" } } },
      { product: { sku: { contains: search, mode: "insensitive" } } },
      { facility: { facilityName: { contains: search, mode: "insensitive" } } },
      { personInCharge: { profile: { firstName: { contains: search, mode: "insensitive" } } } },
      { personInCharge: { profile: { lastName: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.productionBatch.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: { select: { id: true, productName: true, sku: true, currentStock: true, unitLabel: true } },
        facility: { select: { id: true, facilityName: true, facilityCode: true } },
        personInCharge: {
          select: {
            id: true,
            profile: { select: { id: true, firstName: true, lastName: true } },
            position: { select: { id: true, name: true } },
          },
        },
        confirmedByUser: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            ingredient: { select: { id: true, productName: true, sku: true, unitLabel: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productionBatch.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return paginated(reply, items, meta, "Production batches retrieved successfully");
};
