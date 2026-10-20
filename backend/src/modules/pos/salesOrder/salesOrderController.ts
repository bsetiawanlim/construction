import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { sendReceiptEmail } from "../../../utils/email";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateSalesOrderType,
    UpdateSalesOrderType,
    DeleteSalesOrderType,
    GetSalesOrderType,
    CompleteSalesOrderType,
    VoidSalesOrderType,
    RefundSalesOrderType,
    SalesOrderQueryType,
    DailySalesSummaryType,
    ProductSalesReportType,
    CreateTableOrderType,
    PayTableOrderType,
    GetTableOrderStatusType,
    GetTableMenuType,
    CheckTableDinerType,
    SendTableReceiptType,
} from "./salesOrderSchema";
import { validateStockSufficiency } from "./recipeDeduction";
import {
    calculateItemTotals,
    calculateOrderTotals,
    generateOrderNumber,
    recalculateOrderHeader,
} from "./salesOrderCalculation";

export const createSalesOrderController: TypedHandler<CreateSalesOrderType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    // Validate customer if provided
    if (data.customerId) {
        const existingCustomer = await prisma.customer.findFirst({
            where: { id: data.customerId, deletedAt: null },
        });
        if (!existingCustomer) {
            throw AppError.notFound("Customer not found.");
        }
    }

    // Process nested items if provided
    const itemsToCreate: Array<{
        productId: number;
        productName: string;
        unitId?: number | null;
        quantity: number;
        unitPrice: number;
        discountPercentage: number;
        discountAmount: number;
        totalPrice: number;
        notes?: string | null;
    }> = [];

    if (data.items && data.items.length > 0) {
        for (const itemInput of data.items) {
            const product = await prisma.product.findFirst({
                where: { id: itemInput.productId, deletedAt: null },
                include: {
                    productPrice: {
                        where: { deletedAt: null, priceType: "retail" },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
            });

            if (!product) {
                throw AppError.notFound(`Product with ID ${itemInput.productId} not found.`);
            }

            // Stock will be verified comprehensively using recursive recipe ingredients below

            let price = itemInput.unitPrice;
            if (price === undefined || price === null) {
                price = product.productPrice[0] ? Number(product.productPrice[0].amount) : 0;
            }

            const itemCalc = calculateItemTotals({
                quantity: itemInput.quantity,
                unitPrice: price,
                discountPercentage: itemInput.discountPercentage,
            });

            itemsToCreate.push({
                productId: product.id,
                productName: product.productName,
                unitId: itemInput.unitId ?? product.unitId,
                quantity: itemCalc.quantity,
                unitPrice: itemCalc.unitPrice,
                discountPercentage: itemCalc.discountPercentage,
                discountAmount: itemCalc.discountAmount,
                totalPrice: itemCalc.totalPrice,
                notes: itemInput.notes,
            });
        }
    }

    // Validate stock sufficiency considering recipes and base ingredients for the specific facility
    if (itemsToCreate.length > 0) {
        await validateStockSufficiency(itemsToCreate, data.facilityId ?? null);
    }

    const subtotal = itemsToCreate.reduce((sum, item) => sum + item.totalPrice, 0);
    const orderTotals = calculateOrderTotals({
        subtotal,
        includeDiscount: data.includeDiscount,
        discountPercentage: data.discountPercentage,
        includeTax: data.includeTax,
        taxPercentage: data.taxPercentage,
    });

    const orderNumber = await generateOrderNumber();

    const salesOrder = await prisma.salesOrder.create({
        data: {
            orderNumber,
            customerId: data.customerId ?? null,
            facilityId: data.facilityId ?? null,
            tableNumber: data.tableNumber ?? null,
            orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
            subtotal: orderTotals.subtotal,
            includeDiscount: orderTotals.includeDiscount,
            discountPercentage: orderTotals.discountPercentage,
            discountAmount: orderTotals.discountAmount,
            includeTax: orderTotals.includeTax,
            taxPercentage: orderTotals.taxPercentage,
            taxAmount: orderTotals.taxAmount,
            grandTotal: orderTotals.grandTotal,
            currency: data.currency ?? "IDR",
            status: "DRAFT",
            notes: data.notes ?? null,
            createdBy: user.id,
            updatedBy: user.id,
            items: itemsToCreate.length > 0 ? {
                create: itemsToCreate.map((item) => ({
                    productId: item.productId,
                    productName: item.productName,
                    unitId: item.unitId ?? null,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountPercentage: item.discountPercentage,
                    discountAmount: item.discountAmount,
                    totalPrice: item.totalPrice,
                    notes: item.notes ?? null,
                })),
            } : undefined,
        },
        include: {
            customer: true,
            facility: true,
            items: true,
            payments: true,
        },
    });

    return created(reply, { ...salesOrder, salesOrder }, "Sales order successfully created.");
};

export const updateSalesOrderController: TypedHandler<UpdateSalesOrderType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Sales order id is required");
    }

    const existingOrder = await prisma.salesOrder.findFirst({
        where: { id: data.id, deletedAt: null },
    });

    if (!existingOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    if (existingOrder.status !== "DRAFT") {
        throw AppError.badRequest(`Cannot update sales order with status '${existingOrder.status}'. Only DRAFT orders can be modified.`);
    }

    if (data.customerId !== undefined && data.customerId !== null) {
        const existingCustomer = await prisma.customer.findFirst({
            where: { id: data.customerId, deletedAt: null },
        });
        if (!existingCustomer) {
            throw AppError.notFound("Customer not found.");
        }
    }

    const includeDiscount = data.includeDiscount !== undefined ? data.includeDiscount : existingOrder.includeDiscount;
    const discountPercentage = data.discountPercentage !== undefined ? data.discountPercentage : Number(existingOrder.discountPercentage);
    const includeTax = data.includeTax !== undefined ? data.includeTax : existingOrder.includeTax;
    const taxPercentage = data.taxPercentage !== undefined ? data.taxPercentage : Number(existingOrder.taxPercentage);

    const totals = calculateOrderTotals({
        subtotal: Number(existingOrder.subtotal),
        includeDiscount,
        discountPercentage,
        includeTax,
        taxPercentage,
    });

    const updatedOrder = await prisma.salesOrder.update({
        where: { id: data.id },
        data: {
            customerId: data.customerId !== undefined ? data.customerId : existingOrder.customerId,
            facilityId: data.facilityId !== undefined ? data.facilityId : existingOrder.facilityId,
            tableNumber: data.tableNumber !== undefined ? data.tableNumber : existingOrder.tableNumber,
            orderDate: data.orderDate ? new Date(data.orderDate) : existingOrder.orderDate,
            currency: data.currency ?? existingOrder.currency,
            includeDiscount: totals.includeDiscount,
            discountPercentage: totals.discountPercentage,
            discountAmount: totals.discountAmount,
            includeTax: totals.includeTax,
            taxPercentage: totals.taxPercentage,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            notes: data.notes !== undefined ? data.notes : existingOrder.notes,
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            customer: true,
            facility: true,
            items: { where: { deletedAt: null } },
            payments: { where: { deletedAt: null } },
        },
    });

    return success(reply, { ...updatedOrder, salesOrder: updatedOrder }, "Sales order successfully updated.");
};

export const deleteSalesOrderController: TypedHandler<DeleteSalesOrderType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Sales order id is required");
    }

    const existingOrder = await prisma.salesOrder.findFirst({
        where: { id: data.id, deletedAt: null },
    });

    if (!existingOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    if (existingOrder.status !== "DRAFT" && existingOrder.status !== "VOID") {
        throw AppError.badRequest(`Cannot delete a ${existingOrder.status} sales order. Only DRAFT or VOID orders can be deleted.`);
    }

    const now = new Date();
    await prisma.$transaction([
        prisma.salesOrderItem.updateMany({
            where: { salesOrderId: data.id, deletedAt: null },
            data: { deletedAt: now },
        }),
        prisma.salesPayment.updateMany({
            where: { salesOrderId: data.id, deletedAt: null },
            data: { deletedAt: now },
        }),
        prisma.salesOrder.update({
            where: { id: data.id },
            data: {
                deletedAt: now,
                updatedAt: now,
                updatedBy: user.id,
            },
        }),
    ]);

    return success(reply, { id: data.id }, "Sales order successfully deleted.");
};

export const getSalesOrderController: TypedHandler<GetSalesOrderType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Sales order id is required");
    }

    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            customer: true,
            items: {
                where: { deletedAt: null },
                include: {
                    product: {
                        select: {
                            id: true,
                            productName: true,
                            sku: true,
                            barcode: true,
                            currentStock: true,
                        },
                    },
                    unit: true,
                },
            },
            payments: {
                where: { deletedAt: null },
                include: {
                    monetaryAccount: {
                        select: {
                            id: true,
                            accountName: true,
                            institute: true,
                        },
                    },
                },
            },
            salesOrderCreatedBy: { select: { id: true, name: true, email: true } },
            salesOrderUpdatedBy: { select: { id: true, name: true, email: true } },
        },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    return success(reply, { ...salesOrder, salesOrder }, "Sales order successfully fetched.");
};

export const getAllSalesOrdersController: TypedHandler<unknown, unknown, SalesOrderQueryType> = async (request, reply) => {
    const query = request.query;
    const { page, limit, skip, orderBy } = buildPaginationQuery(query);
    const searchFilter = buildSearchFilter(query.search, ["orderNumber", "notes", "tableNumber"]);

    const where: any = {
        deletedAt: null,
        ...searchFilter,
    };

    if (query.status) {
        where.status = query.status;
    }

    if (query.customerId) {
        where.customerId = query.customerId;
    }

    if (query.tableNumber) {
        where.tableNumber = { contains: query.tableNumber, mode: "insensitive" };
    }

    if (query.startDate || query.endDate) {
        where.orderDate = {};
        if (query.startDate) {
            where.orderDate.gte = new Date(query.startDate);
        }
        if (query.endDate) {
            const end = new Date(query.endDate);
            end.setHours(23, 59, 59, 999);
            where.orderDate.lte = end;
        }
    }

    if ((query as any).facilityId) {
        where.facilityId = Number((query as any).facilityId);
    }

    const [salesOrders, total] = await Promise.all([
        prisma.salesOrder.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                customer: {
                    select: { id: true, profileId: true },
                },
                facility: {
                    select: { id: true, facilityCode: true, facilityName: true, type: true },
                },
                items: {
                    where: { deletedAt: null },
                    include: {
                        product: {
                            select: {
                                id: true,
                                productName: true,
                                sku: true,
                                productCategoryId: true,
                                category: { select: { id: true, categoryName: true } },
                            },
                        },
                    },
                },
                payments: {
                    where: { deletedAt: null },
                    select: { id: true, method: true, amount: true, status: true },
                },
                _count: {
                    select: {
                        items: { where: { deletedAt: null } },
                        payments: { where: { deletedAt: null } },
                    },
                },
            },
        }),
        prisma.salesOrder.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, salesOrders, meta, "Sales orders successfully fetched.");
};

export const completeSalesOrderController: TypedHandler<CompleteSalesOrderType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Sales order id is required");
    }

    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            items: {
                where: { deletedAt: null },
                include: { product: true },
            },
            payments: {
                where: { deletedAt: null },
            },
        },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    if (salesOrder.status !== "DRAFT") {
        throw AppError.badRequest(`Cannot complete order with status '${salesOrder.status}'. Order must be in DRAFT status.`);
    }

    if (!salesOrder.items || salesOrder.items.length === 0) {
        throw AppError.badRequest("Cannot complete an order with no items.");
    }

    // Validate stock availability recursively across all item recipes and ingredients for this facility
    const resolvedDeductions = await validateStockSufficiency(salesOrder.items, salesOrder.facilityId ?? null);

    // Validate payment sufficiency
    const settledPayments = salesOrder.payments.filter((p) => p.status === "SETTLED");
    const totalPaid = settledPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const grandTotal = Number(salesOrder.grandTotal);

    if (totalPaid < grandTotal) {
        throw AppError.badRequest(
            `Insufficient payment. Grand total: ${grandTotal}, Total settled payment: ${totalPaid}. Remaining: ${(grandTotal - totalPaid).toFixed(2)}`
        );
    }

    const now = new Date();

    // Execute in transaction
    const completedOrder = await prisma.$transaction(async (tx) => {
        // 1. Deduct stock and record productInventory OUT for each resolved ingredient / product
        for (const [prodId, ded] of resolvedDeductions.entries()) {
            const prod = await tx.product.findUnique({ where: { id: prodId } });
            const currentStockNum = Number(prod?.currentStock ?? 0);
            const newStock = currentStockNum - ded.quantity;

            await tx.product.update({
                where: { id: prodId },
                data: {
                    currentStock: newStock,
                    updatedAt: now,
                    updatedBy: user.id,
                },
            });

            // Deduct location storage stock for this specific facility
            if (salesOrder.facilityId) {
                const storageStock = await tx.productStorageStock.findFirst({
                    where: { productId: prodId, facilityId: salesOrder.facilityId },
                });
                if (storageStock) {
                    await tx.productStorageStock.update({
                        where: { id: storageStock.id },
                        data: {
                            stock: Number(storageStock.stock) - ded.quantity,
                            updatedAt: now,
                        },
                    });
                } else {
                    await tx.productStorageStock.create({
                        data: {
                            productId: prodId,
                            facilityId: salesOrder.facilityId,
                            stock: -ded.quantity,
                            createdAt: now,
                            updatedAt: now,
                        },
                    });
                }
            }

            const deductionNote = ded.path.length > 1
                ? `POS Sale: ${salesOrder.orderNumber} (Used for ${ded.path[0]})`
                : `POS Sale: ${salesOrder.orderNumber}`;

            await tx.productInventory.create({
                data: {
                    productId: prodId,
                    facilityId: salesOrder.facilityId ?? undefined,
                    transactionType: "OUT",
                    quantity: ded.quantity,
                    reference: salesOrder.orderNumber,
                    notes: deductionNote,
                    currentStock: newStock,
                    transactionDate: now,
                    createdAt: now,
                    updatedAt: now,
                    createdBy: user.id,
                    updatedBy: user.id,
                },
            });
        }

        // 2. If cash payment exists and totalPaid > grandTotal, update changeAmount on the CASH payment
        if (totalPaid > grandTotal) {
            const cashPayment = settledPayments.find((p) => p.method === "CASH");
            if (cashPayment) {
                const changeAmount = Number((totalPaid - grandTotal).toFixed(4));
                await tx.salesPayment.update({
                    where: { id: cashPayment.id },
                    data: {
                        changeAmount,
                        updatedAt: now,
                    },
                });
            }
        }

        // 3. Mark salesOrder as COMPLETED
        return tx.salesOrder.update({
            where: { id: salesOrder.id },
            data: {
                status: "COMPLETED",
                updatedAt: now,
                updatedBy: user.id,
            },
            include: {
                customer: true,
                items: { where: { deletedAt: null } },
                payments: { where: { deletedAt: null } },
            },
        });
    });

    return success(reply, { ...completedOrder, salesOrder: completedOrder }, "Sales order completed successfully.");
};

export const voidSalesOrderController: TypedHandler<VoidSalesOrderType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Sales order id is required");
    }

    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            payments: { where: { deletedAt: null } },
        },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    if (salesOrder.status !== "DRAFT") {
        throw AppError.badRequest(`Cannot void order with status '${salesOrder.status}'. Only DRAFT orders can be voided.`);
    }

    const now = new Date();

    const voidedOrder = await prisma.$transaction(async (tx) => {
        // Void or fail any associated payments
        await tx.salesPayment.updateMany({
            where: { salesOrderId: salesOrder.id, deletedAt: null },
            data: {
                status: "FAILED",
                notes: data.notes ? `Order voided: ${data.notes}` : "Order voided",
                updatedAt: now,
            },
        });

        return tx.salesOrder.update({
            where: { id: salesOrder.id },
            data: {
                status: "VOID",
                notes: data.notes ? `${salesOrder.notes ? salesOrder.notes + " | " : ""}Voided: ${data.notes}` : salesOrder.notes,
                updatedAt: now,
                updatedBy: user.id,
            },
            include: {
                customer: true,
                items: { where: { deletedAt: null } },
                payments: { where: { deletedAt: null } },
            },
        });
    });

    return success(reply, { ...voidedOrder, salesOrder: voidedOrder }, "Sales order successfully voided.");
};

export const refundSalesOrderController: TypedHandler<RefundSalesOrderType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Sales order id is required");
    }

    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            items: {
                where: { deletedAt: null },
                include: { product: true },
            },
            payments: { where: { deletedAt: null } },
        },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    if (salesOrder.status !== "COMPLETED") {
        throw AppError.badRequest(`Cannot refund order with status '${salesOrder.status}'. Only COMPLETED orders can be refunded.`);
    }

    const now = new Date();

    const refundedOrder = await prisma.$transaction(async (tx) => {
        // 1. Reverse inventory for all items and recipe ingredients for this facility
        const refundDeductions = await validateStockSufficiency(salesOrder.items, salesOrder.facilityId ?? null, tx).catch(async () => {
            // Even if stock checks fail, we resolve without throwing for refund
            const { resolveProductDeductions } = await import("./recipeDeduction");
            const aggregated = new Map();
            for (const item of salesOrder.items) {
                const itemDeds = await resolveProductDeductions(item.productId, Number(item.quantity), salesOrder.facilityId ?? null, tx);
                for (const [pId, d] of itemDeds.entries()) {
                    if (aggregated.has(pId)) {
                        aggregated.get(pId).quantity += d.quantity;
                    } else {
                        aggregated.set(pId, { ...d });
                    }
                }
            }
            return aggregated;
        });

        for (const [prodId, ded] of refundDeductions.entries()) {
            const prod = await tx.product.findUnique({ where: { id: prodId } });
            const currentStockNum = Number(prod?.currentStock ?? 0);
            const newStock = currentStockNum + ded.quantity;

            await tx.product.update({
                where: { id: prodId },
                data: {
                    currentStock: newStock,
                    updatedAt: now,
                    updatedBy: user.id,
                },
            });

            // Restore location storage stock for this specific facility
            if (salesOrder.facilityId) {
                const storageStock = await tx.productStorageStock.findFirst({
                    where: { productId: prodId, facilityId: salesOrder.facilityId },
                });
                if (storageStock) {
                    await tx.productStorageStock.update({
                        where: { id: storageStock.id },
                        data: {
                            stock: Number(storageStock.stock) + ded.quantity,
                            updatedAt: now,
                        },
                    });
                }
            }

            await tx.productInventory.create({
                data: {
                    productId: prodId,
                    transactionType: "IN",
                    quantity: ded.quantity,
                    reference: `REFUND-${salesOrder.orderNumber}`,
                    notes: data.notes ? `Refund: ${data.notes}` : `POS Refund: ${salesOrder.orderNumber}`,
                    currentStock: newStock,
                    transactionDate: now,
                    createdAt: now,
                    updatedAt: now,
                    createdBy: user.id,
                    updatedBy: user.id,
                },
            });
        }

        // 2. Mark payments as REFUNDED
        await tx.salesPayment.updateMany({
            where: { salesOrderId: salesOrder.id, deletedAt: null },
            data: {
                status: "REFUNDED",
                notes: data.notes ? `Refunded: ${data.notes}` : "Order refunded",
                updatedAt: now,
            },
        });

        // 3. Mark salesOrder as REFUNDED
        return tx.salesOrder.update({
            where: { id: salesOrder.id },
            data: {
                status: "REFUNDED",
                notes: data.notes ? `${salesOrder.notes ? salesOrder.notes + " | " : ""}Refunded: ${data.notes}` : salesOrder.notes,
                updatedAt: now,
                updatedBy: user.id,
            },
            include: {
                customer: true,
                items: { where: { deletedAt: null } },
                payments: { where: { deletedAt: null } },
            },
        });
    });

    return success(reply, { ...refundedOrder, salesOrder: refundedOrder }, "Sales order successfully refunded.");
};

export const getDailySalesSummaryController: TypedHandler<unknown, unknown, DailySalesSummaryType> = async (request, reply) => {
    const query = request.query;

    let targetDateStart: Date;
    let targetDateEnd: Date;

    if (query?.startDate || query?.endDate) {
        if (query?.startDate) {
            targetDateStart = new Date(`${query.startDate.split("T")[0]}T00:00:00.000Z`);
        } else {
            const now = new Date();
            targetDateStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
        }

        if (query?.endDate) {
            targetDateEnd = new Date(`${query.endDate.split("T")[0]}T23:59:59.999Z`);
        } else {
            const now = new Date();
            targetDateEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
        }
    } else if (query?.date) {
        targetDateStart = new Date(`${query.date}T00:00:00.000Z`);
        targetDateEnd = new Date(`${query.date}T23:59:59.999Z`);
    } else {
        const now = new Date();
        targetDateStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        targetDateEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
    }

    const whereSummary: any = {
        status: "COMPLETED",
        deletedAt: null,
        orderDate: {
            gte: targetDateStart,
            lte: targetDateEnd,
        },
    };

    if (query?.facilityId) {
        whereSummary.facilityId = Number(query.facilityId);
    }

    const orders = await prisma.salesOrder.findMany({
        where: whereSummary,
        include: {
            payments: {
                where: { deletedAt: null, status: "SETTLED" },
            },
            items: {
                where: { deletedAt: null },
                select: { quantity: true },
            },
        },
        orderBy: { orderDate: "asc" },
    });

    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalGrandTotal = 0;
    let totalItemsSold = 0;

    const paymentBreakdown: Record<string, { count: number; totalAmount: number }> = {
        CASH: { count: 0, totalAmount: 0 },
        CARD: { count: 0, totalAmount: 0 },
        BANK_TRANSFER: { count: 0, totalAmount: 0 },
        EWALLET: { count: 0, totalAmount: 0 },
    };

    // Build day-by-day continuous trend map
    const trendMap = new Map<string, { date: string; revenue: number; orderCount: number; itemsSold: number }>();

    // Pre-populate continuous dates between targetDateStart and targetDateEnd
    const cur = new Date(targetDateStart);
    while (cur <= targetDateEnd) {
        const dStr = cur.toISOString().split("T")[0]!;
        if (!trendMap.has(dStr)) {
            trendMap.set(dStr, { date: dStr, revenue: 0, orderCount: 0, itemsSold: 0 });
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
    }

    for (const order of orders) {
        const grand = Number(order.grandTotal);
        totalSubtotal += Number(order.subtotal);
        totalDiscount += Number(order.discountAmount);
        totalTax += Number(order.taxAmount);
        totalGrandTotal += grand;

        let orderItemCount = 0;
        for (const it of order.items || []) {
            orderItemCount += Number(it.quantity);
        }
        totalItemsSold += orderItemCount;

        const dayKey = (order.orderDate || new Date()).toISOString().split("T")[0]!;
        if (!trendMap.has(dayKey)) {
            trendMap.set(dayKey, { date: dayKey, revenue: 0, orderCount: 0, itemsSold: 0 });
        }
        const trend = trendMap.get(dayKey)!;
        trend.revenue += grand;
        trend.orderCount += 1;
        trend.itemsSold += orderItemCount;

        for (const payment of order.payments) {
            const method = payment.method;
            if (!paymentBreakdown[method]) {
                paymentBreakdown[method] = { count: 0, totalAmount: 0 };
            }
            paymentBreakdown[method].count += 1;
            const netPaid = Number(payment.amount) - Number(payment.changeAmount);
            paymentBreakdown[method].totalAmount += netPaid;
        }
    }

    const avgOrderValue = orders.length > 0 ? Number((totalGrandTotal / orders.length).toFixed(2)) : 0;
    const dailyTrend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return success(reply, {
        date: query?.date || targetDateStart.toISOString().split("T")[0],
        startDate: targetDateStart.toISOString().split("T")[0],
        endDate: targetDateEnd.toISOString().split("T")[0],
        totalOrders: orders.length,
        totalItemsSold,
        averageOrderValue: avgOrderValue,
        totalSubtotal: Number(totalSubtotal.toFixed(4)),
        totalDiscount: Number(totalDiscount.toFixed(4)),
        totalTax: Number(totalTax.toFixed(4)),
        totalRevenue: Number(totalGrandTotal.toFixed(4)),
        paymentBreakdown,
        dailyTrend,
    }, "Sales summary fetched successfully.");
};

export const getProductSalesReportController: TypedHandler<unknown, unknown, ProductSalesReportType> = async (request, reply) => {
    const query = request.query;

    const limit = query?.limit ? Number(query.limit) : 10;
    const dateFilter: any = {};

    if (query?.startDate) {
        dateFilter.gte = new Date(query.startDate);
    }
    if (query?.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
    }

    const salesOrderWhere: any = {
        status: "COMPLETED",
        deletedAt: null,
        ...(Object.keys(dateFilter).length > 0 ? { orderDate: dateFilter } : {}),
    };

    if (query?.facilityId) {
        salesOrderWhere.facilityId = Number(query.facilityId);
    }

    const items = await prisma.salesOrderItem.findMany({
        where: {
            deletedAt: null,
            salesOrder: salesOrderWhere,
        },
        select: {
            productId: true,
            productName: true,
            quantity: true,
            totalPrice: true,
            unitPrice: true,
            product: {
                select: {
                    sku: true,
                    unitLabel: true,
                    unit: { select: { abbr: true } },
                    category: { select: { categoryName: true } },
                    productImages: {
                        where: { deletedAt: null },
                        select: { imageUrl: true, isPrimary: true },
                        take: 1,
                    },
                },
            },
        },
    });

    const productMap = new Map<number, {
        productId: number;
        productName: string;
        sku?: string | null;
        unitLabel: string;
        categoryName: string;
        imageUrl?: string | null;
        totalOrdersCount: number;
        totalQuantitySold: number;
        totalRevenue: number;
    }>();

    for (const item of items) {
        const existing = productMap.get(item.productId);
        const qty = Number(item.quantity);
        const rev = Number(item.totalPrice);
        const uLabel = item.product?.unitLabel || item.product?.unit?.abbr || "pcs";
        const catName = item.product?.category?.categoryName || "General";
        const img = item.product?.productImages?.[0]?.imageUrl || null;

        if (existing) {
            existing.totalQuantitySold += qty;
            existing.totalRevenue += rev;
            existing.totalOrdersCount += 1;
        } else {
            productMap.set(item.productId, {
                productId: item.productId,
                productName: item.productName,
                sku: item.product?.sku || null,
                unitLabel: uLabel,
                categoryName: catName,
                imageUrl: img,
                totalOrdersCount: 1,
                totalQuantitySold: qty,
                totalRevenue: rev,
            });
        }
    }

    const sortedProducts = Array.from(productMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit)
        .map((p) => ({
            ...p,
            totalQuantitySold: Number(p.totalQuantitySold.toFixed(2)),
            totalRevenue: Number(p.totalRevenue.toFixed(4)),
            averagePrice: p.totalQuantitySold > 0 ? Number((p.totalRevenue / p.totalQuantitySold).toFixed(2)) : 0,
        }));

    return success(reply, {
        products: sortedProducts,
        totalProductsSold: sortedProducts.length,
    }, "Product sales report fetched successfully.");
};

async function resolveMonetaryAccountId(method: string, tx: any = prisma): Promise<number | null> {
    if (method === "CASH") {
        const cashAcc = await tx.monetaryAccount.findFirst({
            where: { accountType: "cashAccount", deletedAt: null },
        });
        return cashAcc?.id ?? null;
    }
    if (method === "EWALLET") {
        const ewalAcc = (await tx.monetaryAccount.findFirst({
            where: { accountId: "ACC-EWAL-003", deletedAt: null },
        })) || (await tx.monetaryAccount.findFirst({
            where: { accountType: "bankAccount", deletedAt: null },
        }));
        return ewalAcc?.id ?? null;
    }
    const bankAcc = await tx.monetaryAccount.findFirst({
        where: { accountType: "bankAccount", deletedAt: null },
    });
    return bankAcc?.id ?? null;
}

export async function applyOrderInventoryDeductions(
    salesOrder: { id: number; orderNumber: string; facilityId: number | null },
    items: Array<{ productId: number; quantity: number | any }>,
    tx: any,
    userId?: string | null
) {
    const now = new Date();
    const resolvedDeductions = await validateStockSufficiency(items, salesOrder.facilityId ?? null, tx);

    let effectiveUserId = userId;
    if (!effectiveUserId) {
        const defaultUser = await tx.user.findFirst({ select: { id: true } });
        effectiveUserId = defaultUser?.id ?? "system";
    }

    for (const [prodId, ded] of resolvedDeductions.entries()) {
        const prod = await tx.product.findUnique({ where: { id: prodId } });
        const currentStockNum = Number(prod?.currentStock ?? 0);
        const newStock = currentStockNum - ded.quantity;

        await tx.product.update({
            where: { id: prodId },
            data: {
                currentStock: newStock,
                updatedAt: now,
                updatedBy: effectiveUserId,
            },
        });

        // Deduct location storage stock for this specific facility
        if (salesOrder.facilityId) {
            const storageStock = await tx.productStorageStock.findFirst({
                where: { productId: prodId, facilityId: salesOrder.facilityId },
            });
            if (storageStock) {
                await tx.productStorageStock.update({
                    where: { id: storageStock.id },
                    data: {
                        stock: Number(storageStock.stock) - ded.quantity,
                        updatedAt: now,
                    },
                });
            } else {
                await tx.productStorageStock.create({
                    data: {
                        productId: prodId,
                        facilityId: salesOrder.facilityId,
                        stock: -ded.quantity,
                        createdAt: now,
                        updatedAt: now,
                    },
                });
            }
        }

        const deductionNote = ded.path.length > 1
            ? `POS Sale: ${salesOrder.orderNumber} (Used for ${ded.path[0]})`
            : `POS Sale: ${salesOrder.orderNumber}`;

        await tx.productInventory.create({
            data: {
                productId: prodId,
                facilityId: salesOrder.facilityId ?? undefined,
                transactionType: "OUT",
                quantity: ded.quantity,
                reference: salesOrder.orderNumber,
                notes: deductionNote,
                currentStock: newStock,
                transactionDate: now,
                createdAt: now,
                updatedAt: now,
                createdBy: effectiveUserId,
                updatedBy: effectiveUserId,
            },
        });
    }

    return resolvedDeductions;
}

// ── Check Table Diner Details (Email & Phone Registration & Conflict Check) ─
export const checkTableDinerController = async (
    request: FastifyRequest<{ Querystring: CheckTableDinerType }>,
    reply: FastifyReply
) => {
    const rawEmail = request.query.email?.trim().toLowerCase();
    const rawPhone = request.query.phone?.trim();
    const rawName = request.query.name?.trim();

    if (!rawEmail && !rawPhone) {
        return success(reply, {
            emailRegistered: false,
            phoneRegistered: false,
            sameProfile: false,
            isConflict: false,
            profileName: null,
            targetName: null,
            resolutionNote: null,
        });
    }

    let profileByEmail: any = null;
    if (rawEmail) {
        profileByEmail = await prisma.profile.findFirst({
            where: {
                email: { equals: rawEmail, mode: "insensitive" },
                deletedAt: null,
            },
            select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, whatsapp: true },
        });
    }

    let profileByPhone: any = null;
    if (rawPhone) {
        const cleanPhone = rawPhone.replace(/[\s\-()]/g, "");
        profileByPhone = await prisma.profile.findFirst({
            where: {
                OR: [
                    { phoneNumber: rawPhone },
                    { phoneNumber: cleanPhone },
                    { whatsapp: rawPhone },
                    { whatsapp: cleanPhone },
                ],
                deletedAt: null,
            },
            select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, whatsapp: true },
        });
    }

    const emailRegistered = Boolean(profileByEmail);
    const phoneRegistered = Boolean(profileByPhone);
    const isConflict = Boolean(profileByEmail && profileByPhone && profileByEmail.id !== profileByPhone.id);
    const sameProfile = Boolean(profileByEmail && profileByPhone && profileByEmail.id === profileByPhone.id);

    let profileName: string | null = null;
    let targetName: string | null = null;
    let resolutionNote: string | null = null;

    if (isConflict) {
        const emailFullName = `${profileByEmail.firstName || ""} ${profileByEmail.lastName || ""}`.trim();
        const phoneFullName = `${profileByPhone.firstName || ""} ${profileByPhone.lastName || ""}`.trim();
        const inputNameLower = (rawName || "").toLowerCase();

        const matchesEmailName = Boolean(inputNameLower && emailFullName.toLowerCase().includes(inputNameLower));
        const matchesPhoneName = Boolean(inputNameLower && phoneFullName.toLowerCase().includes(inputNameLower));

        if (matchesEmailName && !matchesPhoneName) {
            targetName = emailFullName;
            profileName = emailFullName;
            resolutionNote = `Order will be linked to ${emailFullName} based on your name. WhatsApp will be used for delivery notices.`;
        } else if (matchesPhoneName && !matchesEmailName) {
            targetName = phoneFullName;
            profileName = phoneFullName;
            resolutionNote = `Order will be linked to ${phoneFullName} based on your name. Email will be used for your digital receipt.`;
        } else {
            targetName = phoneFullName;
            profileName = phoneFullName;
            resolutionNote = `Order will be linked to WhatsApp customer ${phoneFullName} (primary). Email will be used for your receipt.`;
        }
    } else if (profileByPhone) {
        const fullName = `${profileByPhone.firstName || ""} ${profileByPhone.lastName || ""}`.trim();
        profileName = fullName;
        targetName = fullName;
    } else if (profileByEmail) {
        const fullName = `${profileByEmail.firstName || ""} ${profileByEmail.lastName || ""}`.trim();
        profileName = fullName;
        targetName = fullName;
    }

    return success(reply, {
        emailRegistered,
        phoneRegistered,
        sameProfile,
        isConflict,
        profileName,
        targetName,
        resolutionNote,
    });
};

// ── Resolve or Automatically Create Customer & Profile for Table Orders ────────
async function resolveOrCreateTableCustomer(
    input: {
        customerName?: string | null;
        customerPhone?: string | null;
        customerEmail?: string | null;
        tableNumber: string;
    },
    guestUserId?: string | null
): Promise<{ customerId: number | null; customer: any | null; conflictNote?: string | null }> {
    const rawEmail = input.customerEmail?.trim().toLowerCase();
    const rawPhone = input.customerPhone?.trim();
    const rawName = input.customerName?.trim();

    if (!rawEmail && !rawPhone && !rawName) {
        return { customerId: null, customer: null, conflictNote: null };
    }

    // Determine an actor user ID for foreign key createdBy / updatedBy
    let actorId = guestUserId;
    if (!actorId) {
        const fallbackUser = await prisma.user.findFirst({
            where: { deletedAt: null },
            orderBy: [{ isSuperAdmin: "desc" }, { createdAt: "asc" }],
            select: { id: true }
        });
        actorId = fallbackUser?.id || null;
    }

    if (!actorId) {
        return { customerId: null, customer: null, conflictNote: null };
    }

    // 1. Check if email matches any registered profile
    let profileByEmail: any = null;
    if (rawEmail) {
        profileByEmail = await prisma.profile.findFirst({
            where: {
                email: { equals: rawEmail, mode: "insensitive" },
                deletedAt: null,
            },
        });
    }

    // 2. Check if phone/WhatsApp matches any registered profile
    let profileByPhone: any = null;
    if (rawPhone) {
        const cleanPhone = rawPhone.replace(/[\s\-()]/g, "");
        profileByPhone = await prisma.profile.findFirst({
            where: {
                OR: [
                    { phoneNumber: rawPhone },
                    { phoneNumber: cleanPhone },
                    { whatsapp: rawPhone },
                    { whatsapp: cleanPhone },
                ],
                deletedAt: null,
            },
        });
    }

    let targetProfile: any = null;
    let conflictNote: string | null = null;

    if (profileByEmail && profileByPhone) {
        if (profileByEmail.id === profileByPhone.id) {
            // Both email and WhatsApp point to the EXACT same person
            targetProfile = profileByEmail;
            const updateData: any = {};
            if (!targetProfile.phoneNumber && rawPhone) updateData.phoneNumber = rawPhone;
            if (!targetProfile.whatsapp && rawPhone) updateData.whatsapp = rawPhone;
            if (Object.keys(updateData).length > 0) {
                updateData.updatedBy = actorId;
                targetProfile = await prisma.profile.update({
                    where: { id: targetProfile.id },
                    data: updateData,
                });
            }
        } else {
            // CONFLICT (Option A): Email belongs to Profile A, WhatsApp belongs to Profile B
            // Resolve using Name matching, fallback to WhatsApp (primary F&B identifier in ID).
            // STRICT SAFETY RULE: Zero Overwrite. Never mutate either profile's master contacts.
            const emailName = `${profileByEmail.firstName || ""} ${profileByEmail.lastName || ""}`.trim().toLowerCase();
            const phoneName = `${profileByPhone.firstName || ""} ${profileByPhone.lastName || ""}`.trim().toLowerCase();
            const inputNameLower = (rawName || "").toLowerCase();

            const matchesEmailProfileName = Boolean(inputNameLower && emailName && (emailName.includes(inputNameLower) || inputNameLower.includes(emailName)));
            const matchesPhoneProfileName = Boolean(inputNameLower && phoneName && (phoneName.includes(inputNameLower) || inputNameLower.includes(phoneName)));

            if (matchesEmailProfileName && !matchesPhoneProfileName) {
                targetProfile = profileByEmail;
                conflictNote = `WhatsApp ${rawPhone} belongs to Profile #${profileByPhone.id} (${profileByPhone.firstName}). Order assigned to ${profileByEmail.firstName} via name match.`;
            } else if (matchesPhoneProfileName && !matchesEmailProfileName) {
                targetProfile = profileByPhone;
                conflictNote = `Email ${rawEmail} belongs to Profile #${profileByEmail.id} (${profileByEmail.firstName}). Order assigned to ${profileByPhone.firstName} via name match.`;
            } else {
                targetProfile = profileByPhone;
                conflictNote = `Email ${rawEmail} belongs to Profile #${profileByEmail.id} (${profileByEmail.firstName}). Order assigned to WhatsApp customer ${profileByPhone.firstName} (F&B priority).`;
            }
        }
    } else if (profileByEmail) {
        // Only email is registered
        targetProfile = profileByEmail;
        // Safely fill in phone/whatsapp only if currently empty
        if (!targetProfile.phoneNumber && !targetProfile.whatsapp && rawPhone) {
            targetProfile = await prisma.profile.update({
                where: { id: targetProfile.id },
                data: {
                    phoneNumber: rawPhone,
                    whatsapp: rawPhone,
                    updatedBy: actorId,
                },
            });
        }
    } else if (profileByPhone) {
        // Only phone/whatsapp is registered
        targetProfile = profileByPhone;
        // Safely fill in email only if currently empty
        if (!targetProfile.email && rawEmail) {
            targetProfile = await prisma.profile.update({
                where: { id: targetProfile.id },
                data: {
                    email: rawEmail,
                    updatedBy: actorId,
                },
            });
        }
    } else {
        // Neither email nor WhatsApp is registered -> Check by name or create a brand new profile
        let existingByName: any = null;
        if (rawName && rawName.length >= 3 && !rawName.toLowerCase().startsWith("table")) {
            const nameParts = rawName.split(" ").filter(Boolean);
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ") || null;
            existingByName = await prisma.profile.findFirst({
                where: {
                    firstName: { equals: firstName, mode: "insensitive" },
                    ...(lastName ? { lastName: { equals: lastName, mode: "insensitive" } } : {}),
                    email: null,
                    phoneNumber: null,
                    deletedAt: null,
                },
            });
        }

        if (existingByName) {
            targetProfile = await prisma.profile.update({
                where: { id: existingByName.id },
                data: {
                    email: rawEmail || null,
                    phoneNumber: rawPhone || null,
                    whatsapp: rawPhone || null,
                    updatedBy: actorId,
                },
            });
        } else {
            // Create new profile with the name, email, and WhatsApp
            let firstName = "Guest";
            let lastName: string | null = null;
            if (rawName) {
                const nameParts = rawName.split(" ").filter(Boolean);
                firstName = nameParts[0] || "Guest";
                lastName = nameParts.slice(1).join(" ") || null;
            } else if (rawEmail) {
                firstName = rawEmail.split("@")[0] || "Guest";
            }

            targetProfile = await prisma.profile.create({
                data: {
                    firstName,
                    lastName,
                    email: rawEmail || null,
                    phoneNumber: rawPhone || null,
                    whatsapp: rawPhone || null,
                    isCompany: false,
                    country: "Indonesia",
                    notes: `Diner registered via Table Order (Table ${input.tableNumber})`,
                    createdBy: actorId,
                    updatedBy: actorId,
                },
            });
        }
    }

    // Find or create customer record linked to this profile
    let customer = await prisma.customer.findFirst({
        where: {
            profileId: targetProfile.id,
            deletedAt: null,
        },
        include: {
            profile: true,
        },
    });

    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                profileId: targetProfile.id,
                customergroup: 1, // Regular Customer
                createdBy: actorId,
                updatedBy: actorId,
            },
            include: {
                profile: true,
            },
        });
    }

    return { customerId: customer.id, customer, conflictNote };
}

export const createTableOrderController = async (
    request: FastifyRequest<{ Body: CreateTableOrderType }>,
    reply: FastifyReply
) => {
    const data = request.body;
    if (!data) {
        throw AppError.badRequest("No order data provided");
    }

    const facility = await prisma.facility.findFirst({
        where: { id: data.facilityId, deletedAt: null },
    });
    if (!facility) {
        throw AppError.notFound("Facility not found or unavailable.");
    }

    if (!data.items || data.items.length === 0) {
        throw AppError.badRequest("At least one item is required to place a table order.");
    }

    // Process nested items
    const itemsToCreate: Array<{
        productId: number;
        productName: string;
        unitId?: number | null;
        quantity: number;
        unitPrice: number;
        discountPercentage: number;
        discountAmount: number;
        totalPrice: number;
        notes?: string | null;
    }> = [];

    for (const itemInput of data.items) {
        const product = await prisma.product.findFirst({
            where: { id: itemInput.productId, deletedAt: null },
            include: {
                productPrice: {
                    where: { deletedAt: null, priceType: "retail" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!product) {
            throw AppError.notFound(`Product with ID ${itemInput.productId} not found.`);
        }

        let price = itemInput.unitPrice;
        if (price === undefined || price === null) {
            price = product.productPrice[0] ? Number(product.productPrice[0].amount) : 0;
        }

        const itemCalc = calculateItemTotals({
            quantity: itemInput.quantity,
            unitPrice: price,
            discountPercentage: itemInput.discountPercentage ?? 0,
        });

        itemsToCreate.push({
            productId: product.id,
            productName: product.productName,
            unitId: itemInput.unitId ?? product.unitId,
            quantity: itemCalc.quantity,
            unitPrice: itemCalc.unitPrice,
            discountPercentage: itemCalc.discountPercentage,
            discountAmount: itemCalc.discountAmount,
            totalPrice: itemCalc.totalPrice,
            notes: itemInput.notes,
        });
    }

    const itemsSubtotal = itemsToCreate.reduce((sum, item) => sum + item.totalPrice, 0);

    const orderTotals = calculateOrderTotals({
        subtotal: itemsSubtotal,
        includeDiscount: false,
        discountPercentage: 0,
        includeTax: false,
        taxPercentage: 0,
    });

    const orderNumber = await generateOrderNumber();
    const guestUser = request.session?.user;

    // Resolve customer & profile record (or create if not existing)
    const resolvedCustomer = await resolveOrCreateTableCustomer(
        {
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            tableNumber: data.tableNumber,
        },
        guestUser?.id
    );

    const guestDetails = [
        data.customerName ? `Guest: ${data.customerName}` : null,
        data.customerPhone ? `Phone: ${data.customerPhone}` : null,
        data.customerEmail ? `Email: ${data.customerEmail}` : null,
        `Table: ${data.tableNumber}`,
        data.notes ? `Note: ${data.notes}` : null,
        resolvedCustomer.conflictNote ? `[${resolvedCustomer.conflictNote}]` : null,
    ].filter(Boolean).join(" | ");

    // Prepare customer cookie payload for client recognition
    const customerCookie = resolvedCustomer?.customer ? {
        customerId: resolvedCustomer.customer.id,
        name: (resolvedCustomer.customer.profile ? `${resolvedCustomer.customer.profile.firstName} ${resolvedCustomer.customer.profile.lastName || ""}` : data.customerName || "").trim(),
        phone: resolvedCustomer.customer.profile?.phoneNumber || data.customerPhone || null,
        email: resolvedCustomer.customer.profile?.email || data.customerEmail || null,
    } : null;

    if (customerCookie && (customerCookie.name || customerCookie.email || customerCookie.phone)) {
        reply.header(
            "Set-Cookie",
            `pz_table_customer=${encodeURIComponent(JSON.stringify(customerCookie))}; Path=/; Max-Age=31536000; SameSite=Lax`
        );
    }

    // If order is paid online at checkout:
    if (data.isPaid) {
        const paymentMethod = data.paymentMethod || "EWALLET";
        const paymentProvider = data.paymentProvider || "QRIS";
        const refNumber = data.referenceNumber || `ONLINE-${orderNumber}`;

        // Validate stock sufficiency recursively before taking payment / completing
        await validateStockSufficiency(itemsToCreate, data.facilityId ?? null);

        const completedOrder = await prisma.$transaction(async (tx) => {
            const monetaryAccountId = await resolveMonetaryAccountId(paymentMethod, tx);

            const so = await tx.salesOrder.create({
                data: {
                    orderNumber,
                    facilityId: data.facilityId,
                    tableNumber: data.tableNumber,
                    customerId: resolvedCustomer?.customerId ?? null,
                    orderDate: new Date(),
                    subtotal: orderTotals.subtotal,
                    includeDiscount: false,
                    discountPercentage: 0,
                    discountAmount: 0,
                    includeTax: false,
                    taxPercentage: 0,
                    taxAmount: 0,
                    grandTotal: orderTotals.grandTotal,
                    currency: "IDR",
                    status: "COMPLETED",
                    notes: `${guestDetails || ""} | [Paid Online via ${paymentProvider}]`.trim(),
                    createdBy: guestUser?.id ?? null,
                    updatedBy: guestUser?.id ?? null,
                    items: {
                        create: itemsToCreate.map((item) => ({
                            productId: item.productId,
                            productName: item.productName,
                            unitId: item.unitId ?? null,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            discountPercentage: item.discountPercentage,
                            discountAmount: item.discountAmount,
                            totalPrice: item.totalPrice,
                            notes: item.notes ?? null,
                        })),
                    },
                },
                include: {
                    facility: true,
                    items: true,
                    customer: { include: { profile: true } },
                },
            });

            // Create settled payment record
            await tx.salesPayment.create({
                data: {
                    salesOrderId: so.id,
                    method: paymentMethod,
                    amount: orderTotals.grandTotal,
                    changeAmount: 0,
                    referenceNumber: refNumber,
                    monetaryAccountId,
                    status: "SETTLED",
                    notes: `Online Payment (${paymentProvider}) settled at table checkout`,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            // Deduct recipe & ingredient stock now that order is paid and processed
            await applyOrderInventoryDeductions(so, itemsToCreate, tx, guestUser?.id);

            return tx.salesOrder.findUnique({
                where: { id: so.id },
                include: {
                    facility: true,
                    items: true,
                    payments: true,
                    customer: { include: { profile: true } },
                },
            });
        });

        return created(reply, { ...completedOrder, salesOrder: completedOrder, customer: customerCookie }, "Table order paid online and sent to kitchen for preparation.");
    }

    // Otherwise create as DRAFT [Awaiting Online Payment]
    const draftNote = `${guestDetails || ""} | [Awaiting Online Payment]`.trim();

    const salesOrder = await prisma.salesOrder.create({
        data: {
            orderNumber,
            facilityId: data.facilityId,
            tableNumber: data.tableNumber,
            customerId: resolvedCustomer?.customerId ?? null,
            orderDate: new Date(),
            subtotal: orderTotals.subtotal,
            includeDiscount: false,
            discountPercentage: 0,
            discountAmount: 0,
            includeTax: false,
            taxPercentage: 0,
            taxAmount: 0,
            grandTotal: orderTotals.grandTotal,
            currency: "IDR",
            status: "DRAFT",
            notes: draftNote || null,
            createdBy: guestUser?.id ?? null,
            updatedBy: guestUser?.id ?? null,
            items: {
                create: itemsToCreate.map((item) => ({
                    productId: item.productId,
                    productName: item.productName,
                    unitId: item.unitId ?? null,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountPercentage: item.discountPercentage,
                    discountAmount: item.discountAmount,
                    totalPrice: item.totalPrice,
                    notes: item.notes ?? null,
                })),
            },
        },
        include: {
            facility: true,
            items: true,
            payments: true,
            customer: { include: { profile: true } },
        },
    });

    return created(reply, { ...salesOrder, salesOrder, customer: customerCookie }, "Table order placed. Awaiting online payment before kitchen processing.");
};

export const payTableOrderController = async (
    request: FastifyRequest<{ Body: PayTableOrderType }>,
    reply: FastifyReply
) => {
    const data = request.body;

    if (!data?.salesOrderId) {
        throw AppError.badRequest("Sales order ID is required.");
    }

    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: data.salesOrderId, deletedAt: null },
        include: {
            facility: true,
            items: { where: { deletedAt: null } },
            payments: { where: { deletedAt: null } },
        },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    if (salesOrder.status === "COMPLETED") {
        return success(reply, { ...salesOrder, salesOrder }, "Order has already been paid and processed.");
    }

    if (salesOrder.status !== "DRAFT") {
        throw AppError.badRequest(`Cannot pay order with status '${salesOrder.status}'. Order must be in DRAFT status.`);
    }

    if (!salesOrder.items || salesOrder.items.length === 0) {
        throw AppError.badRequest("Cannot pay an order with no items.");
    }

    // Validate stock sufficiency before taking payment
    await validateStockSufficiency(salesOrder.items, salesOrder.facilityId ?? null);

    const paymentMethod = data.paymentMethod || "EWALLET";
    const paymentProvider = data.paymentProvider || "QRIS";
    const refNumber = data.referenceNumber || `ONLINE-${salesOrder.orderNumber}-${Date.now().toString().slice(-4)}`;

    const completedOrder = await prisma.$transaction(async (tx) => {
        const monetaryAccountId = await resolveMonetaryAccountId(paymentMethod, tx);

        // Record the online settled payment
        await tx.salesPayment.create({
            data: {
                salesOrderId: salesOrder.id,
                method: paymentMethod,
                amount: salesOrder.grandTotal,
                changeAmount: 0,
                referenceNumber: refNumber,
                monetaryAccountId,
                status: "SETTLED",
                notes: `Online Payment (${paymentProvider}) settled via Table Barcode checkout`,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        // Deduct inventory
        await applyOrderInventoryDeductions(salesOrder, salesOrder.items, tx);

        // Update sales order to COMPLETED
        const updatedNotes = (salesOrder.notes || "")
            .replace("[Awaiting Online Payment]", `[Paid Online via ${paymentProvider}]`)
            .trim();

        return tx.salesOrder.update({
            where: { id: salesOrder.id },
            data: {
                status: "COMPLETED",
                notes: updatedNotes || `[Paid Online via ${paymentProvider}]`,
                updatedAt: new Date(),
            },
            include: {
                facility: true,
                items: { where: { deletedAt: null } },
                payments: { where: { deletedAt: null } },
            },
        });
    });

    return success(reply, { ...completedOrder, salesOrder: completedOrder }, "Payment successful! Order confirmed and sent to kitchen for preparation.");
};

export const getTableOrderStatusController = async (
    request: FastifyRequest<{ Querystring: GetTableOrderStatusType }>,
    reply: FastifyReply
) => {
    const { salesOrderId } = request.query;

    if (!salesOrderId) {
        throw AppError.badRequest("salesOrderId query parameter is required.");
    }

    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: salesOrderId, deletedAt: null },
        include: {
            facility: {
                select: { id: true, facilityName: true, facilityCode: true, address: true, phoneNumber: true },
            },
            items: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    productId: true,
                    productName: true,
                    quantity: true,
                    unitPrice: true,
                    totalPrice: true,
                    notes: true,
                },
            },
            payments: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    method: true,
                    amount: true,
                    status: true,
                    referenceNumber: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    const isPaid = salesOrder.status === "COMPLETED" || salesOrder.payments.some((p) => p.status === "SETTLED");

    let kitchenStatus = "Awaiting Online Payment";
    if (salesOrder.status === "COMPLETED") {
        kitchenStatus = "In Kitchen / Cooking";
    } else if (salesOrder.status === "VOID") {
        kitchenStatus = "Order Cancelled";
    } else if (salesOrder.status === "REFUNDED") {
        kitchenStatus = "Refunded";
    }

    return success(reply, {
        order: salesOrder,
        isPaid,
        kitchenStatus,
        status: salesOrder.status,
    }, "Table order status retrieved.");
};

export const getTableMenuController = async (
    request: FastifyRequest<{ Querystring: GetTableMenuType }>,
    reply: FastifyReply
) => {
    const { facilityId } = request.query;

    let facility = null;
    if (facilityId) {
        facility = await prisma.facility.findFirst({
            where: { id: facilityId, deletedAt: null },
            select: { id: true, facilityCode: true, facilityName: true, type: true, address: true, phoneNumber: true },
        });
    }

    if (!facility) {
        facility = await prisma.facility.findFirst({
            where: { deletedAt: null },
            select: { id: true, facilityCode: true, facilityName: true, type: true, address: true, phoneNumber: true },
        });
    }

    const [categories, products] = await Promise.all([
        prisma.productCategory.findMany({
            where: { deletedAt: null },
            orderBy: { categoryName: "asc" },
            select: { id: true, categoryName: true, description: true },
        }),
        prisma.product.findMany({
            where: { deletedAt: null },
            include: {
                category: true,
                productPrice: {
                    where: { deletedAt: null, priceType: "retail" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                productImages: {
                    where: { deletedAt: null },
                    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                    take: 1,
                },
                unit: true,
            },
            orderBy: { productName: "asc" },
        }),
    ]);

    const cleanDescription = (rawDesc: string | null | undefined): string | null => {
        if (!rawDesc) return null;
        const stripped = rawDesc.replace(/---RECIPE_SPEC_START---[\s\S]*?(---RECIPE_SPEC_END---|$)/g, "").trim();
        return stripped.length > 0 ? stripped : null;
    };

    const formattedProducts = products.map((p) => {
        const price = p.productPrice[0] ? Number(p.productPrice[0].amount) : 0;
        const img = p.productImages && p.productImages.length > 0 && p.productImages[0] ? p.productImages[0].imageUrl : null;
        return {
            id: p.id,
            name: p.productName,
            sku: p.sku,
            barcode: p.barcode,
            description: cleanDescription(p.description),
            price,
            categoryId: p.productCategoryId,
            categoryName: p.category?.categoryName ?? "General",
            unitId: p.unitId,
            unitLabel: p.unitLabel ?? p.unit?.unit ?? null,
            imageUrl: img,
        };
    });

    return success(reply, {
        facility,
        categories: categories.map((c) => ({ id: c.id, name: c.categoryName, description: c.description })),
        products: formattedProducts,
    }, "Table ordering menu retrieved successfully.");
};

export const sendTableReceiptController = async (
    request: FastifyRequest<{ Body: SendTableReceiptType }>,
    reply: FastifyReply
) => {
    const { salesOrderId, channel, destination, customerName } = request.body;

    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: salesOrderId, deletedAt: null },
        include: {
            facility: {
                select: { id: true, facilityName: true, address: true, phoneNumber: true },
            },
            items: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    productId: true,
                    productName: true,
                    quantity: true,
                    unitPrice: true,
                    totalPrice: true,
                    notes: true,
                },
            },
            payments: {
                where: { deletedAt: null },
                select: {
                    id: true,
                    method: true,
                    amount: true,
                    changeAmount: true,
                    status: true,
                    referenceNumber: true,
                    notes: true,
                },
            },
            customer: {
                include: {
                    profile: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phoneNumber: true,
                            whatsapp: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    const effectiveCustomerName =
        customerName ||
        (salesOrder.customer?.profile
            ? `${salesOrder.customer.profile.firstName || ""} ${salesOrder.customer.profile.lastName || ""}`.trim()
            : null) ||
        "Valued Diner";

    const facilityName = salesOrder.facility?.facilityName || "Chrono Cafe & Eatery";
    const address = salesOrder.facility?.address || "Jl. Senopati No. 45, Kebayoran Baru";
    const paymentInfo = salesOrder.payments[0];
    const paymentMethodLabel = paymentInfo?.notes || paymentInfo?.method || "PAID (Online)";

    // Format receipt text
    const dateStr = new Date(salesOrder.orderDate || Date.now()).toLocaleString("id-ID");
    const lines: string[] = [
        `🧾 *OFFICIAL SALES RECEIPT*`,
        `📍 *${facilityName}*`,
        address,
        `━━━━━━━━━━━━━━━━━━━━`,
        `*Order Reference:* ${salesOrder.orderNumber}`,
        `*Table:* 🪑 Table ${salesOrder.tableNumber || "-"}`,
        `*Date:* ${dateStr}`,
        `*Customer:* ${effectiveCustomerName}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `*ITEMS ORDERED:*`,
    ];

    for (const item of salesOrder.items) {
        lines.push(`• ${item.quantity}x ${item.productName} - Rp ${Number(item.totalPrice).toLocaleString("id-ID")}`);
        if (item.notes) {
            lines.push(`  ↳ Note: "${item.notes}"`);
        }
    }

    lines.push(
        `━━━━━━━━━━━━━━━━━━━━`,
        `*TOTAL PAID: Rp ${Number(salesOrder.grandTotal).toLocaleString("id-ID")}*`,
        `*Payment:* ${paymentMethodLabel}`,
        `*Kitchen Status:* In Kitchen • Cooking Now`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `Staff will deliver your freshly prepared order directly to Table ${salesOrder.tableNumber || "-"}.`,
        `Thank you for dining with us! 🙏`,
    );

    const message = lines.join("\n");

    let waUrl: string | null = null;
    let mailtoUrl: string | null = null;

    if (channel === "WHATSAPP") {
        let cleanPhone = destination.replace(/[^\d+]/g, "");
        if (cleanPhone.startsWith("+")) cleanPhone = cleanPhone.substring(1);
        if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.substring(1);
        else if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;

        waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    } else {
        // Actually send the email via nodemailer
        try {
            await sendReceiptEmail({
                to: destination,
                customerName: effectiveCustomerName,
                orderNumber: salesOrder.orderNumber,
                orderDate: new Date(salesOrder.orderDate || Date.now()),
                facilityName,
                facilityAddress: salesOrder.facility?.address ?? null,
                items: salesOrder.items.map((item) => ({
                    productName: item.productName,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    totalPrice: Number(item.totalPrice),
                    notes: item.notes ?? null,
                })),
                subtotal: Number(salesOrder.subtotal),
                discountAmount: Number(salesOrder.discountAmount ?? 0),
                discountPercentage: Number(salesOrder.discountPercentage ?? 0),
                includeDiscount: salesOrder.includeDiscount ?? false,
                taxAmount: Number(salesOrder.taxAmount ?? 0),
                taxPercentage: Number(salesOrder.taxPercentage ?? 0),
                includeTax: salesOrder.includeTax ?? false,
                grandTotal: Number(salesOrder.grandTotal),
                payments: salesOrder.payments.filter((p) => p.status === "SETTLED").map((p) => ({
                    method: p.method,
                    amount: Number(p.amount),
                    changeAmount: Number(p.changeAmount ?? 0),
                })),
                tableNumber: salesOrder.tableNumber ?? null,
                promoCode: (salesOrder as any).promoCode ?? null,
            });
        } catch (emailErr: any) {
            throw AppError.badRequest(`Failed to send email: ${emailErr.message}`);
        }
        mailtoUrl = null;
    }

    // Log receipt dispatch in order notes
    const dispatchNote = `[Receipt sent to ${channel}: ${destination}]`;
    if (!salesOrder.notes?.includes(dispatchNote)) {
        const updatedNotes = salesOrder.notes ? `${salesOrder.notes} | ${dispatchNote}` : dispatchNote;
        await prisma.salesOrder.update({
            where: { id: salesOrder.id },
            data: { notes: updatedNotes, updatedAt: new Date() },
        });
    }

    return success(reply, {
        success: true,
        channel,
        destination,
        message,
        waUrl,
        mailtoUrl,
    }, `Receipt successfully dispatched to ${channel}: ${destination}`);
};



