import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import { getProfileById } from "../../personal/profile/profileController";
import {
    MonetaryAccountType,
    GetByProfileType,
    DeleteMonetaryAccountType,
} from "./monetaryAccountSchema";

export const createMonetaryAccountController: TypedHandler<MonetaryAccountType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingAccount = await prisma.monetaryAccount.findFirst({
        where: {
            deletedAt: null,
            accountName: data.accountName,
            accountType: data.accountType,
            ...(data.accountId ? { accountId: data.accountId } : {}),
        },
    });
    if (existingAccount) {
        throw AppError.conflict("Account already exists with this name and account identifier");
    }

    if (data.profileId) {
        const profile = await prisma.profile.findFirst({
            where: { id: data.profileId, deletedAt: null },
        });
        if (!profile) {
            throw AppError.notFound("Associated profile not found");
        }
    }

    const account = await prisma.monetaryAccount.create({
        data: {
            institute: data.institute ?? undefined,
            accountName: data.accountName,
            accountId: data.accountId ?? undefined,
            profileId: data.profileId ?? undefined,
            accountType: data.accountType,
            description: data.description ?? undefined,
            balance: data.balance ?? 0,
            createdBy: user.id,
            updatedBy: user.id,
        },
    });

    return created(reply, { account }, "Account successfully created.");
};

export const updateMonetaryAccountController: TypedHandler<MonetaryAccountType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Account id is required");
    }

    const existingAccount = await prisma.monetaryAccount.findFirst({
        where: {
            id: data.id,
            deletedAt: null,
        },
    });
    if (!existingAccount) {
        throw AppError.notFound("Account not found");
    }

    const account = await prisma.monetaryAccount.update({
        where: { id: data.id },
        data: {
            institute: data.institute ?? undefined,
            accountName: data.accountName,
            accountId: data.accountId ?? undefined,
            accountType: data.accountType,
            description: data.description ?? undefined,
            balance: data.balance ?? undefined,
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { account }, "Account successfully updated.");
};

export const getMonetaryAccountController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const query = request.query;
    // Support pagination if query provided
    const { page, limit, skip } = buildPaginationQuery(query);
    const searchFilter = buildSearchFilter(query?.search, ["accountName", "accountId", "institute", "description"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [accounts, total] = await Promise.all([
        prisma.monetaryAccount.findMany({
            where,
            skip,
            take: limit,
            orderBy: { accountName: "asc" },
        }),
        prisma.monetaryAccount.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, accounts, meta, "Monetary accounts retrieved successfully");
};

export const getMonetaryAccountControllerByProfile: TypedHandler<GetByProfileType> = async (request, reply) => {
    const profileId = request.body?.profileId;
    if (!profileId) {
        throw AppError.badRequest("profileId is required");
    }

    const profile = await prisma.profile.findFirst({
        where: { id: Number(profileId), deletedAt: null },
    });
    if (!profile) {
        throw AppError.notFound("Profile not found");
    }

    const accounts = await prisma.monetaryAccount.findMany({
        where: {
            deletedAt: null,
            profileId: Number(profileId),
        },
    });

    return success(reply, accounts, "Accounts fetched successfully");
};

export const getMonetaryAccountByIdController: TypedHandler<unknown, { id: string }> = async (request, reply) => {
    const id = Number(request.params.id);
    if (isNaN(id)) {
        throw AppError.badRequest("Invalid account id");
    }

    const account = await prisma.monetaryAccount.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    });

    if (!account) {
        throw AppError.notFound("Account not found");
    }

    return success(reply, account, "Account retrieved successfully");
};

export const deleteMonetaryAccountController: TypedHandler<DeleteMonetaryAccountType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Account id is required");
    }

    const existingAccount = await prisma.monetaryAccount.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingAccount) {
        throw AppError.notFound("Account not found");
    }

    const account = await prisma.monetaryAccount.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { account }, "Account successfully deleted.");
};