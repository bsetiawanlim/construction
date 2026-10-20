import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateWorkType,
    UpdateWorkType,
    DeleteWorkType,
    GetWorkType,
} from "./workSchema";

export const createWorkController: TypedHandler<CreateWorkType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const work = await prisma.work.create({
        data: {
            name:        data.name,
            description: data.description ?? undefined,
            unitId:      data.unitId ?? undefined,
            unitPrice:   data.unitPrice,
            amount:      data.amount,
            totalPrice:  data.totalPrice,
            createdAt:   new Date(),
            updatedAt:   new Date(),
            createdBy:   user.id,
            updatedBy:   user.id,
        },
        include: {
            workItem:      true,
            workWorker:    true,
            workEquipment: true,
        },
    });

    return created(reply, { work }, "Work successfully created.");
};

export const updateWorkController: TypedHandler<UpdateWorkType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Work id is required");
    }

    const existingWork = await prisma.work.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingWork) {
        throw AppError.notFound("Work not found.");
    }

    const work = await prisma.work.update({
        where: { id: data.id },
        data: {
            ...(data.name        !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.unitId      !== undefined && { unitId: data.unitId }),
            ...(data.unitPrice   !== undefined && { unitPrice: data.unitPrice }),
            ...(data.amount      !== undefined && { amount: data.amount }),
            ...(data.totalPrice  !== undefined && { totalPrice: data.totalPrice }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            workItem:      true,
            workWorker:    true,
            workEquipment: true,
        },
    });

    return success(reply, { work }, "Work successfully updated.");
};

export const deleteWorkController: TypedHandler<DeleteWorkType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Work id is required");
    }

    const existingWork = await prisma.work.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingWork) {
        throw AppError.notFound("Work not found.");
    }

    const work = await prisma.work.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { work }, "Work successfully deleted.");
};

export const getWorkController: TypedHandler<GetWorkType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Work id is required");
    }

    const work = await prisma.work.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            unit:          true,
            workItem:      { include: { item: true } },
            workWorker:    { include: { worker: true } },
            workEquipment: { include: { equipment: true } },
        },
    });

    if (!work) {
        throw AppError.notFound("Work not found.");
    }

    return success(reply, { work }, "Work successfully fetched.");
};

export const getWorksController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["name", "description"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [works, total] = await Promise.all([
        prisma.work.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                unit:          true,
                workItem:      true,
                workWorker:    true,
                workEquipment: true,
            },
        }),
        prisma.work.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, works, meta, "Works successfully fetched.");
};
