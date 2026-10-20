import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success } from "../../../utils/response";
import { TypedHandler } from "../../../types/fastify";
import { CreateProductInventoryType, GetProductInventoryType } from "./productInventorySchema";

export const createProductInventoryController: TypedHandler<CreateProductInventoryType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingProduct = await prisma.product.findFirst({
        where: { id: data.productId, deletedAt: null },
    });
    if (!existingProduct) {
        throw AppError.notFound("Product not found.");
    }

    const currentStockNum = Number(existingProduct.currentStock);
    const qtyNum = data.quantity;

    // Calculate new stock based on transaction type
    let newStockNum = currentStockNum;
    if (data.transactionType === "IN") {
        newStockNum += qtyNum;
    } else if (data.transactionType === "OUT") {
        if (currentStockNum < qtyNum) {
            throw AppError.badRequest(`Insufficient stock. Current stock: ${currentStockNum}, requested: ${qtyNum}`);
        }
        newStockNum -= qtyNum;
    } else if (data.transactionType === "ADJUSTMENT") {
        newStockNum = qtyNum; // Set stock to exact value
    }

    // Use transaction to ensure stock consistency
    const [inventory] = await prisma.$transaction(async (tx) => {
        const inv = await tx.productInventory.create({
            data: {
                productId: data.productId,
                facilityId: data.facilityId ?? undefined,
                sectionId: data.sectionId ?? undefined,
                transactionType: data.transactionType,
                quantity: qtyNum,
                reference: data.reference ?? undefined,
                notes: data.notes ?? undefined,
                transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
                currentStock: newStockNum,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: user.id,
                updatedBy: user.id,
            },
        });

        await tx.product.update({
            where: { id: data.productId },
            data: { currentStock: newStockNum, updatedAt: new Date(), updatedBy: user.id },
        });

        if (data.facilityId) {
            const existingStorage = await tx.productStorageStock.findFirst({
                where: {
                    productId: data.productId,
                    facilityId: data.facilityId,
                    sectionId: data.sectionId ?? null,
                },
            });

            let newFacilityStock = qtyNum;
            if (existingStorage) {
                const prev = Number(existingStorage.stock);
                if (data.transactionType === "IN") newFacilityStock = prev + qtyNum;
                else if (data.transactionType === "OUT") newFacilityStock = Math.max(0, prev - qtyNum);
                else newFacilityStock = qtyNum;

                await tx.productStorageStock.update({
                    where: { id: existingStorage.id },
                    data: { stock: newFacilityStock, updatedAt: new Date() },
                });
            } else {
                await tx.productStorageStock.create({
                    data: {
                        productId: data.productId,
                        facilityId: data.facilityId,
                        sectionId: data.sectionId ?? null,
                        stock: newFacilityStock,
                    },
                });
            }
        }

        return [inv];
    });

    return created(reply, {
        inventory,
        currentStock: newStockNum,
    }, "Inventory transaction successfully recorded.");
};

export const getProductInventoryController: TypedHandler<GetProductInventoryType> = async (request, reply) => {
    const data = request.body;

    if (!data?.productId) {
        throw AppError.badRequest("Product id is required.");
    }

    const existingProduct = await prisma.product.findFirst({
        where: { id: data.productId, deletedAt: null },
        select: { id: true, productName: true, sku: true, currentStock: true, unitId: true, unitLabel: true },
    });
    if (!existingProduct) {
        throw AppError.notFound("Product not found.");
    }

    const where: any = {
        productId: data.productId,
        deletedAt: null,
        ...(data.facilityId ? { facilityId: data.facilityId } : {}),
    };

    const inventory = await prisma.productInventory.findMany({
        where,
        include: {
            facility: { select: { id: true, facilityName: true, facilityCode: true } },
            section: { select: { id: true, sectionName: true, sectionCode: true } },
        },
        orderBy: { transactionDate: "desc" },
    });

    return success(reply, {
        product: existingProduct,
        inventory,
        currentStock: Number(existingProduct.currentStock),
    }, "Product inventory successfully fetched.");
};
