import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateWorkerType,
    UpdateWorkerType,
    DeleteWorkerType,
    GetWorkerType,
} from "./workerSchema";

export const addWorkerController: TypedHandler<CreateWorkerType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingWorker = await prisma.worker.findFirst({
        where: {
            name:      data.name,
            unitId:    data.unitId ?? null,
            deletedAt: null,
        },
    });
    if (existingWorker) {
        throw AppError.conflict("Worker already exists!");
    }

    const worker = await prisma.worker.create({
        data: {
            name:        data.name,
            description: data.description ?? undefined,
            unitId:      data.unitId ?? undefined,
            createdAt:   new Date(),
            updatedAt:   new Date(),
            createdBy:   user.id,
            updatedBy:   user.id,
        },
    });

    return created(reply, { worker }, "Worker successfully created.");
};

export const updateWorkerController: TypedHandler<UpdateWorkerType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Worker id is required");
    }

    const worker = await prisma.worker.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!worker) {
        throw AppError.notFound("Worker not found!");
    }

    const updatedWorker = await prisma.worker.update({
        where: { id: data.id },
        data: {
            ...(data.name        !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.unitId      !== undefined && { unitId: data.unitId }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { updatedWorker }, "Worker successfully updated.");
};

export const deleteWorkerController: TypedHandler<DeleteWorkerType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Worker id is required");
    }

    const worker = await prisma.worker.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!worker) {
        throw AppError.notFound("Worker not found!");
    }

    const updatedWorker = await prisma.worker.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { updatedWorker }, "Worker successfully deleted.");
};

export const getWorkerController: TypedHandler<GetWorkerType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Worker id is required");
    }

    const existingWorker = await prisma.worker.findFirst({
        where:   { id: data.id, deletedAt: null },
        include: { workWorker: { include: { work: true } } },
    });
    if (!existingWorker) {
        throw AppError.notFound("Worker not found!");
    }

    return success(reply, { existingWorker }, "Worker successfully retrieved.");
};

export const getAllWorkersController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["name", "description"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [workers, total] = await Promise.all([
        prisma.worker.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { unit: true },
        }),
        prisma.worker.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, workers, meta, "Workers successfully retrieved.");
};