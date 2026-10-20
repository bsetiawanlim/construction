import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    MonetaryTransactionType,
    UpdateMonetaryTransactionType,
    DeleteMonetaryTransactionType,
    GetMonetaryTransactionsByAccountType,
} from "./monetaryTransactionSchema";

export const createMonetaryTransactionController: TypedHandler<MonetaryTransactionType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    if (data.sourceAccountId === data.targetAccountId) {
        throw AppError.badRequest("Source and target accounts must be different");
    }

    const [sourceAccount, targetAccount] = await Promise.all([
        prisma.monetaryAccount.findFirst({
            where: { id: data.sourceAccountId, deletedAt: null },
        }),
        prisma.monetaryAccount.findFirst({
            where: { id: data.targetAccountId, deletedAt: null },
        }),
    ]);

    if (!sourceAccount) {
        throw AppError.notFound("Source account not found.");
    }
    if (!targetAccount) {
        throw AppError.notFound("Target account not found.");
    }

    const transaction = await prisma.monetaryTransaction.create({
        data: {
            sourceAccountId: data.sourceAccountId,
            targetAccountId: data.targetAccountId,
            description:     data.description ?? undefined,
            transactionFlow: data.transactionFlow,
            amount:          data.amount,
            currency:        data.currency ?? "IDR",
            status:          data.status ?? "pending",
            createdAt:       new Date(),
            updatedAt:       new Date(),
            createdBy:       user.id,
            updatedBy:       user.id,
        },
        include: { sourceAccount: true, targetAccount: true },
    });

    return created(reply, { transaction }, "Transaction successfully created.");
};

export const updateMonetaryTransactionController: TypedHandler<UpdateMonetaryTransactionType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Transaction id is required");
    }

    const existingTransaction = await prisma.monetaryTransaction.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingTransaction) {
        throw AppError.notFound("Transaction not found.");
    }

    const transaction = await prisma.monetaryTransaction.update({
        where: { id: data.id },
        data: {
            ...(data.description     !== undefined && { description: data.description }),
            ...(data.transactionFlow !== undefined && { transactionFlow: data.transactionFlow }),
            ...(data.amount          !== undefined && { amount: data.amount }),
            ...(data.status          !== undefined && { status: data.status }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { sourceAccount: true, targetAccount: true },
    });

    return success(reply, { transaction }, "Transaction successfully updated.");
};

export const deleteMonetaryTransactionController: TypedHandler<DeleteMonetaryTransactionType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Transaction id is required");
    }

    const existingTransaction = await prisma.monetaryTransaction.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingTransaction) {
        throw AppError.notFound("Transaction not found.");
    }

    const transaction = await prisma.monetaryTransaction.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { transaction }, "Transaction successfully deleted.");
};

export const getMonetaryTransactionsController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["description", "transactionFlow", "currency", "status"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [transactions, total] = await Promise.all([
        prisma.monetaryTransaction.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { sourceAccount: true, targetAccount: true },
        }),
        prisma.monetaryTransaction.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, transactions, meta, "Transactions successfully fetched.");
};

export const getMonetaryTransactionsByAccountController: TypedHandler<GetMonetaryTransactionsByAccountType> = async (request, reply) => {
    const data = request.body;

    if (!data?.accountId) {
        throw AppError.badRequest("accountId is required");
    }

    const transactions = await prisma.monetaryTransaction.findMany({
        where: {
            deletedAt: null,
            OR: [
                { sourceAccountId: data.accountId },
                { targetAccountId: data.accountId },
            ],
        },
        orderBy: { createdAt: "desc" },
        include: { sourceAccount: true, targetAccount: true },
    });

    return success(reply, { transactions }, "Transactions successfully fetched.");
};
