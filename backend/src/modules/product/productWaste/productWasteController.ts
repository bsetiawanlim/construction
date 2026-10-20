import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, paginated } from "../../../utils/response";
import { buildPaginationMeta } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import { CreateProductWasteType, GetProductWasteType } from "./productWasteSchema";

/**
 * Record a lost, spoiled, damaged, or expired product write-off.
 * Deducts stock from product and productStorageStock while recording
 * an audit entry in productWaste and productInventory.
 */
export const createProductWasteController: TypedHandler<CreateProductWasteType> = async (request, reply) => {
  const data = request.body;
  const user = request.session?.user;

  if (!user) {
    throw AppError.unauthorized("Authentication required");
  }

  if (!data?.productId) {
    throw AppError.badRequest("Product ID is required");
  }

  const existingProduct = await prisma.product.findFirst({
    where: { id: data.productId, deletedAt: null },
    include: {
      productPrice: { where: { deletedAt: null } },
      vendorProducts: { where: { deletedAt: null } },
    },
  });

  if (!existingProduct) {
    throw AppError.notFound("Product not found.");
  }

  const currentStockNum = Number(existingProduct.currentStock ?? 0);
  const qtyNum = Number(data.quantity);

  if (qtyNum <= 0) {
    throw AppError.badRequest("Quantity must be greater than 0");
  }

  // Determine unit cost fallback if not explicitly provided
  let unitCostNum = 0;
  if (data.unitCost !== undefined && data.unitCost !== null) {
    unitCostNum = Number(data.unitCost);
  } else {
    // Try vendor product price first, then retail price
    const vendorPrice = existingProduct.vendorProducts?.[0]?.vendorPrice;
    const retailPrice = existingProduct.productPrice?.find((p) => p.priceType === "retail")?.amount || existingProduct.productPrice?.[0]?.amount;
    if (vendorPrice !== undefined && vendorPrice !== null) {
      unitCostNum = Number(vendorPrice);
    } else if (retailPrice !== undefined && retailPrice !== null) {
      unitCostNum = Number(retailPrice);
    }
  }

  const totalCostNum = unitCostNum * qtyNum;
  const newStockNum = Math.max(0, currentStockNum - qtyNum);
  const wasteDate = data.wasteDate ? new Date(data.wasteDate) : new Date();

  const [waste, inventory] = await prisma.$transaction(async (tx) => {
    // 1. Create productWaste log
    const createdWaste = await tx.productWaste.create({
      data: {
        productId: data.productId,
        facilityId: data.facilityId ?? null,
        sectionId: data.sectionId ?? null,
        quantity: qtyNum,
        unitCost: unitCostNum,
        totalCost: totalCostNum,
        reason: data.reason,
        notes: data.notes ?? null,
        wasteDate,
        createdBy: user.id,
        updatedBy: user.id,
      },
      include: {
        product: { select: { id: true, productName: true, sku: true, unitLabel: true } },
        facility: { select: { id: true, facilityName: true, facilityCode: true } },
        section: { select: { id: true, sectionName: true, sectionCode: true } },
      },
    });

    // 2. Deduct product global stock
    await tx.product.update({
      where: { id: data.productId },
      data: {
        currentStock: newStockNum,
        updatedAt: new Date(),
        updatedBy: user.id,
      },
    });

    // 3. Deduct facility section storage stock if facility specified
    if (data.facilityId) {
      const storage = await tx.productStorageStock.findFirst({
        where: {
          productId: data.productId,
          facilityId: data.facilityId,
          sectionId: data.sectionId ?? null,
        },
      });

      if (storage) {
        const prevFacilityStock = Number(storage.stock);
        const newFacilityStock = Math.max(0, prevFacilityStock - qtyNum);
        await tx.productStorageStock.update({
          where: { id: storage.id },
          data: {
            stock: newFacilityStock,
            updatedAt: new Date(),
          },
        });
      }
    }

    // 4. Create ledger snapshot in productInventory for audit completeness
    const invNote = `Loss/Waste Write-off (${data.reason}): ${data.notes || "Recorded via Waste Management"}`;
    const inv = await tx.productInventory.create({
      data: {
        productId: data.productId,
        facilityId: data.facilityId ?? null,
        sectionId: data.sectionId ?? null,
        transactionType: "OUT",
        quantity: qtyNum,
        reference: `WASTE-#${createdWaste.id}`,
        notes: invNote,
        transactionDate: wasteDate,
        currentStock: newStockNum,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    return [createdWaste, inv];
  });

  return created(
    reply,
    {
      waste,
      currentStock: newStockNum,
    },
    `Product write-off recorded successfully (${data.reason}).`
  );
};

/**
 * List paginated lost/spoiled/expired product write-offs with optional filters.
 */
export const getProductWasteController: TypedHandler<GetProductWasteType> = async (request, reply) => {
  const query = request.body || {};
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
  };

  if (query.productId) where.productId = Number(query.productId);
  if (query.facilityId) where.facilityId = Number(query.facilityId);
  if (query.reason) where.reason = query.reason;

  if (query.startDate || query.endDate) {
    where.wasteDate = {};
    if (query.startDate) where.wasteDate.gte = new Date(query.startDate);
    if (query.endDate) where.wasteDate.lte = new Date(query.endDate);
  }

  const [items, total] = await Promise.all([
    prisma.productWaste.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            productName: true,
            sku: true,
            unitLabel: true,
            category: { select: { id: true, categoryName: true } },
          },
        },
        facility: {
          select: {
            id: true,
            facilityName: true,
            facilityCode: true,
            type: true,
          },
        },
        section: {
          select: {
            id: true,
            sectionName: true,
            sectionCode: true,
          },
        },
        wasteCreatedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { wasteDate: "desc" },
    }),
    prisma.productWaste.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return paginated(reply, items, meta, "Product waste log fetched successfully.", "wasteRecords");
};
