import { validateStockSufficiency } from "../salesOrder/recipeDeduction";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success } from "../../../utils/response";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateSalesOrderItemType,
    UpdateSalesOrderItemType,
    DeleteSalesOrderItemType,
    GetSalesOrderItemType,
    ListSalesOrderItemsType,
} from "./salesOrderItemSchema";
import { calculateItemTotals, recalculateOrderHeader } from "../salesOrder/salesOrderCalculation";

export const createSalesOrderItemController: TypedHandler<CreateSalesOrderItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    // 1. Validate sales order
    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: data.salesOrderId, deletedAt: null },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    if (salesOrder.status !== "DRAFT") {
        throw AppError.badRequest(`Cannot add items to an order with status '${salesOrder.status}'. Order must be in DRAFT status.`);
    }

    // 2. Validate product
    const product = await prisma.product.findFirst({
        where: { id: data.productId, deletedAt: null },
        include: {
            productPrice: {
                where: { deletedAt: null, priceType: "retail" },
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });

    if (!product) {
        throw AppError.notFound("Product not found.");
    }

    // 3. Validate stock sufficiency recursively (checking ingredients / product stock for this facility)
    await validateStockSufficiency(
        [{ productId: product.id, quantity: data.quantity }],
        salesOrder.facilityId ?? null
    );

    // 4. Determine price
    let unitPrice = data.unitPrice;
    if (unitPrice === undefined || unitPrice === null) {
        unitPrice = product.productPrice[0] ? Number(product.productPrice[0].amount) : 0;
    }

    // 5. Calculate item totals
    const calc = calculateItemTotals({
        quantity: data.quantity,
        unitPrice,
        discountPercentage: data.discountPercentage,
    });

    // 6. Create item and recalculate parent order
    const item = await prisma.salesOrderItem.create({
        data: {
            salesOrderId: data.salesOrderId,
            productId: product.id,
            productName: product.productName, // Snapshot product name
            unitId: data.unitId ?? product.unitId,
            quantity: calc.quantity,
            unitPrice: calc.unitPrice,
            discountPercentage: calc.discountPercentage,
            discountAmount: calc.discountAmount,
            totalPrice: calc.totalPrice,
            notes: data.notes ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        include: {
            product: true,
            unit: true,
        },
    });

    await recalculateOrderHeader(data.salesOrderId);

    return created(reply, { ...item, item }, "Sales order item successfully added.");
};

export const updateSalesOrderItemController: TypedHandler<UpdateSalesOrderItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Sales order item id is required");
    }

    const existingItem = await prisma.salesOrderItem.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            salesOrder: true,
            product: true,
        },
    });

    if (!existingItem) {
        throw AppError.notFound("Sales order item not found.");
    }

    if (existingItem.salesOrder.status !== "DRAFT") {
        throw AppError.badRequest(`Cannot update item in an order with status '${existingItem.salesOrder.status}'. Order must be in DRAFT status.`);
    }

    const quantity = data.quantity !== undefined ? data.quantity : Number(existingItem.quantity);
    const unitPrice = data.unitPrice !== undefined ? data.unitPrice : Number(existingItem.unitPrice);
    const discountPercentage = data.discountPercentage !== undefined ? data.discountPercentage : Number(existingItem.discountPercentage);

    // Validate stock if quantity changed for this facility
    if (data.quantity !== undefined) {
        await validateStockSufficiency(
            [{ productId: existingItem.productId, quantity }],
            existingItem.salesOrder.facilityId ?? null
        );
    }

    const calc = calculateItemTotals({
        quantity,
        unitPrice,
        discountPercentage,
    });

    const updatedItem = await prisma.salesOrderItem.update({
        where: { id: data.id },
        data: {
            unitId: data.unitId !== undefined ? data.unitId : existingItem.unitId,
            quantity: calc.quantity,
            unitPrice: calc.unitPrice,
            discountPercentage: calc.discountPercentage,
            discountAmount: calc.discountAmount,
            totalPrice: calc.totalPrice,
            notes: data.notes !== undefined ? data.notes : existingItem.notes,
            updatedAt: new Date(),
        },
        include: {
            product: true,
            unit: true,
        },
    });

    await recalculateOrderHeader(existingItem.salesOrderId);

    return success(reply, { ...updatedItem, item: updatedItem }, "Sales order item successfully updated.");
};

export const deleteSalesOrderItemController: TypedHandler<DeleteSalesOrderItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Sales order item id is required");
    }

    const existingItem = await prisma.salesOrderItem.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { salesOrder: true },
    });

    if (!existingItem) {
        throw AppError.notFound("Sales order item not found.");
    }

    if (existingItem.salesOrder.status !== "DRAFT") {
        throw AppError.badRequest(`Cannot delete item from an order with status '${existingItem.salesOrder.status}'. Order must be in DRAFT status.`);
    }

    await prisma.salesOrderItem.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
        },
    });

    await recalculateOrderHeader(existingItem.salesOrderId);

    return success(reply, { id: data.id }, "Sales order item successfully removed.");
};

export const getSalesOrderItemController: TypedHandler<GetSalesOrderItemType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Sales order item id is required");
    }

    const item = await prisma.salesOrderItem.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            product: true,
            unit: true,
            salesOrder: true,
        },
    });

    if (!item) {
        throw AppError.notFound("Sales order item not found.");
    }

    return success(reply, { ...item, item }, "Sales order item successfully fetched.");
};

export const listSalesOrderItemsController: TypedHandler<ListSalesOrderItemsType> = async (request, reply) => {
    const data = request.body;

    if (!data?.salesOrderId) {
        throw AppError.badRequest("Sales order id is required");
    }

    const items = await prisma.salesOrderItem.findMany({
        where: {
            salesOrderId: data.salesOrderId,
            deletedAt: null,
        },
        include: {
            product: true,
            unit: true,
        },
        orderBy: { id: "asc" },
    });

    return success(reply, { items }, "Sales order items successfully fetched.");
};
