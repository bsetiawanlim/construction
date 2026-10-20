import { prisma } from "../../../plugins/prisma";

export interface ItemCalculationInput {
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
}

export function calculateItemTotals(input: ItemCalculationInput) {
    const qty = Number(input.quantity) || 0;
    const price = Number(input.unitPrice) || 0;
    const discPct = Math.max(0, Math.min(100, Number(input.discountPercentage) || 0));

    const gross = qty * price;
    const discountAmount = Number(((gross * discPct) / 100).toFixed(4));
    const totalPrice = Number((gross - discountAmount).toFixed(4));

    return {
        quantity: qty,
        unitPrice: price,
        discountPercentage: discPct,
        discountAmount,
        totalPrice,
    };
}

export interface OrderCalculationInput {
    subtotal: number;
    includeDiscount?: boolean;
    discountPercentage?: number;
    includeTax?: boolean;
    taxPercentage?: number;
}

export function calculateOrderTotals(input: OrderCalculationInput) {
    const subtotal = Number(input.subtotal) || 0;
    const includeDiscount = Boolean(input.includeDiscount);
    const discPct = includeDiscount ? Math.max(0, Math.min(100, Number(input.discountPercentage) || 0)) : 0;
    const discountAmount = includeDiscount ? Number(((subtotal * discPct) / 100).toFixed(4)) : 0;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const includeTax = Boolean(input.includeTax);
    const taxPct = includeTax ? Math.max(0, Math.min(100, Number(input.taxPercentage) || 0)) : 0;
    const taxAmount = includeTax ? Number(((taxableAmount * taxPct) / 100).toFixed(4)) : 0;

    const grandTotal = Number((taxableAmount + taxAmount).toFixed(4));

    return {
        subtotal,
        includeDiscount,
        discountPercentage: discPct,
        discountAmount,
        includeTax,
        taxPercentage: taxPct,
        taxAmount,
        grandTotal,
    };
}

export async function recalculateOrderHeader(salesOrderId: number, tx: any = prisma) {
    const items = await tx.salesOrderItem.findMany({
        where: { salesOrderId, deletedAt: null },
    });

    const subtotal = items.reduce((acc: number, item: any) => acc + Number(item.totalPrice), 0);

    const order = await tx.salesOrder.findUnique({
        where: { id: salesOrderId },
    });

    if (!order) return null;

    const totals = calculateOrderTotals({
        subtotal,
        includeDiscount: order.includeDiscount,
        discountPercentage: Number(order.discountPercentage),
        includeTax: order.includeTax,
        taxPercentage: Number(order.taxPercentage),
    });

    return tx.salesOrder.update({
        where: { id: salesOrderId },
        data: {
            subtotal: totals.subtotal,
            discountAmount: totals.discountAmount,
            taxAmount: totals.taxAmount,
            grandTotal: totals.grandTotal,
            updatedAt: new Date(),
        },
    });
}

export async function generateOrderNumber(tx: any = prisma): Promise<string> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const prefix = `SO-${yyyy}${mm}${dd}-`;

    const lastOrder = await tx.salesOrder.findFirst({
        where: {
            orderNumber: { startsWith: prefix },
        },
        orderBy: { orderNumber: "desc" },
    });

    let nextSeq = 1;
    if (lastOrder && lastOrder.orderNumber) {
        const parts = lastOrder.orderNumber.split("-");
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) {
            nextSeq = lastSeq + 1;
        }
    }

    return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}
