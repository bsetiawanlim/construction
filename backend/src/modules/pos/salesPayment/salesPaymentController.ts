import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success } from "../../../utils/response";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateSalesPaymentType,
    UpdateSalesPaymentType,
    DeleteSalesPaymentType,
    GetSalesPaymentType,
    ListSalesPaymentsType,
} from "./salesPaymentSchema";

export const createSalesPaymentController: TypedHandler<CreateSalesPaymentType> = async (request, reply) => {
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
        throw AppError.badRequest(`Cannot add payment to an order with status '${salesOrder.status}'. Order must be in DRAFT status.`);
    }

    // 2. Validate monetary account if provided, or auto-assign from defaults
    let monetaryAccountId = data.monetaryAccountId ?? null;
    if (monetaryAccountId) {
        const monetaryAccount = await prisma.monetaryAccount.findFirst({
            where: { id: monetaryAccountId, deletedAt: null },
        });
        if (!monetaryAccount) {
            throw AppError.notFound("Monetary account not found.");
        }
    } else {
        if (data.method === "CASH") {
            const defaultCash = await prisma.monetaryAccount.findFirst({
                where: { accountType: "cashAccount", deletedAt: null },
            });
            monetaryAccountId = defaultCash?.id ?? null;
        } else if (data.method === "EWALLET") {
            const defaultEwal = (await prisma.monetaryAccount.findFirst({
                where: { accountId: "ACC-EWAL-003", deletedAt: null },
            })) || (await prisma.monetaryAccount.findFirst({
                where: { accountType: "bankAccount", deletedAt: null },
            }));
            monetaryAccountId = defaultEwal?.id ?? null;
        } else {
            const defaultBank = await prisma.monetaryAccount.findFirst({
                where: { accountType: "bankAccount", deletedAt: null },
            });
            monetaryAccountId = defaultBank?.id ?? null;
        }
    }

    // 3. Compute change amount for cash overpayment
    const existingPayments = await prisma.salesPayment.findMany({
        where: {
            salesOrderId: data.salesOrderId,
            deletedAt: null,
            status: "SETTLED",
        },
    });

    const previousPaid = existingPayments.reduce((sum, p) => sum + Number(p.amount) - Number(p.changeAmount), 0);
    const paymentStatus = data.status ?? "SETTLED";
    const grandTotal = Number(salesOrder.grandTotal);

    let changeAmount = 0;
    if (data.method === "CASH" && paymentStatus === "SETTLED") {
        const totalPaid = previousPaid + data.amount;
        if (totalPaid > grandTotal) {
            changeAmount = Number((totalPaid - grandTotal).toFixed(4));
        }
    }

    // 4. Create payment
    const payment = await prisma.salesPayment.create({
        data: {
            salesOrderId: data.salesOrderId,
            method: data.method,
            amount: data.amount,
            changeAmount,
            referenceNumber: data.referenceNumber ?? null,
            monetaryAccountId,
            status: paymentStatus,
            notes: data.notes ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        include: {
            monetaryAccount: true,
        },
    });

    const totalSettledAfter = previousPaid + (paymentStatus === "SETTLED" ? (data.amount - changeAmount) : 0);
    const remainingBalance = Math.max(0, Number((grandTotal - totalSettledAfter).toFixed(4)));

    return created(reply, {
        ...payment,
        payment,
        orderGrandTotal: grandTotal,
        totalSettledPaid: Number(totalSettledAfter.toFixed(4)),
        remainingBalance,
    }, "Sales payment successfully recorded.");
};

export const updateSalesPaymentController: TypedHandler<UpdateSalesPaymentType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Sales payment id is required");
    }

    const existingPayment = await prisma.salesPayment.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { salesOrder: true },
    });

    if (!existingPayment) {
        throw AppError.notFound("Sales payment not found.");
    }

    if (existingPayment.salesOrder.status !== "DRAFT") {
        throw AppError.badRequest(`Cannot update payment for an order with status '${existingPayment.salesOrder.status}'. Order must be in DRAFT status.`);
    }

    if (data.monetaryAccountId !== undefined && data.monetaryAccountId !== null) {
        const monetaryAccount = await prisma.monetaryAccount.findFirst({
            where: { id: data.monetaryAccountId, deletedAt: null },
        });
        if (!monetaryAccount) {
            throw AppError.notFound("Monetary account not found.");
        }
    }

    const updatedPayment = await prisma.salesPayment.update({
        where: { id: data.id },
        data: {
            method: data.method ?? existingPayment.method,
            amount: data.amount !== undefined ? data.amount : existingPayment.amount,
            referenceNumber: data.referenceNumber !== undefined ? data.referenceNumber : existingPayment.referenceNumber,
            monetaryAccountId: data.monetaryAccountId !== undefined ? data.monetaryAccountId : existingPayment.monetaryAccountId,
            status: data.status ?? existingPayment.status,
            notes: data.notes !== undefined ? data.notes : existingPayment.notes,
            updatedAt: new Date(),
        },
        include: {
            monetaryAccount: true,
        },
    });

    return success(reply, { ...updatedPayment, payment: updatedPayment }, "Sales payment successfully updated.");
};

export const deleteSalesPaymentController: TypedHandler<DeleteSalesPaymentType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Sales payment id is required");
    }

    const existingPayment = await prisma.salesPayment.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { salesOrder: true },
    });

    if (!existingPayment) {
        throw AppError.notFound("Sales payment not found.");
    }

    if (existingPayment.salesOrder.status !== "DRAFT") {
        throw AppError.badRequest(`Cannot delete payment for an order with status '${existingPayment.salesOrder.status}'. Order must be in DRAFT status.`);
    }

    await prisma.salesPayment.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
        },
    });

    return success(reply, { id: data.id }, "Sales payment successfully deleted.");
};

export const getSalesPaymentController: TypedHandler<GetSalesPaymentType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Sales payment id is required");
    }

    const payment = await prisma.salesPayment.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            salesOrder: true,
            monetaryAccount: true,
        },
    });

    if (!payment) {
        throw AppError.notFound("Sales payment not found.");
    }

    return success(reply, { ...payment, payment }, "Sales payment successfully fetched.");
};

export const listSalesPaymentsController: TypedHandler<ListSalesPaymentsType> = async (request, reply) => {
    const data = request.body;

    if (!data?.salesOrderId) {
        throw AppError.badRequest("Sales order id is required");
    }

    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: data.salesOrderId, deletedAt: null },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found.");
    }

    const payments = await prisma.salesPayment.findMany({
        where: {
            salesOrderId: data.salesOrderId,
            deletedAt: null,
        },
        include: {
            monetaryAccount: true,
        },
        orderBy: { id: "asc" },
    });

    const grandTotal = Number(salesOrder.grandTotal);
    const totalSettled = payments
        .filter((p) => p.status === "SETTLED")
        .reduce((sum, p) => sum + Number(p.amount) - Number(p.changeAmount), 0);
    const remainingBalance = Math.max(0, Number((grandTotal - totalSettled).toFixed(4)));

    return success(reply, {
        orderId: salesOrder.id,
        orderNumber: salesOrder.orderNumber,
        grandTotal,
        totalSettledPaid: Number(totalSettled.toFixed(4)),
        remainingBalance,
        payments,
    }, "Sales payments successfully fetched.");
};
