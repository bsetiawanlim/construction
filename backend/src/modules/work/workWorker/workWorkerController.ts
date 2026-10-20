import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateWorkWorkerType,
    UpdateWorkWorkerType,
    DeleteWorkWorkerType,
    GetWorkWorkerType,
    GetWorkWorkersByWorkType,
} from "./workWorkerSchema";

export const createWorkWorkerController: TypedHandler<CreateWorkWorkerType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingWork = await prisma.work.findFirst({
        where: { id: data.workId, deletedAt: null },
    });
    if (!existingWork) {
        throw AppError.notFound("Work not found.");
    }

    const existingWorker = await prisma.worker.findFirst({
        where: { id: data.workerId, deletedAt: null },
    });
    if (!existingWorker) {
        throw AppError.notFound("Worker not found.");
    }

    const existingWorkWorker = await prisma.workWorker.findUnique({
        where: { workId_workerId: { workId: data.workId, workerId: data.workerId } },
    });
    if (existingWorkWorker && !existingWorkWorker.deletedAt) {
        throw AppError.conflict("Worker is already assigned to this work.");
    }

    const workWorker = await prisma.workWorker.create({
        data: {
            workId:     data.workId,
            workerId:   data.workerId,
            unitPrice:  data.unitPrice,
            amount:     data.amount,
            totalPrice: data.totalPrice,
            createdAt:  new Date(),
            updatedAt:  new Date(),
            createdBy:  user.id,
            updatedBy:  user.id,
        },
        include: {
            work:   true,
            worker: true,
        },
    });

    return created(reply, { workWorker }, "WorkWorker successfully created.");
};

export const updateWorkWorkerController: TypedHandler<UpdateWorkWorkerType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.workId || !data?.workerId) {
        throw AppError.badRequest("workId and workerId are required");
    }

    const existingWorkWorker = await prisma.workWorker.findUnique({
        where: { workId_workerId: { workId: data.workId, workerId: data.workerId } },
    });
    if (!existingWorkWorker || existingWorkWorker.deletedAt) {
        throw AppError.notFound("WorkWorker not found.");
    }

    const workWorker = await prisma.workWorker.update({
        where: { workId_workerId: { workId: data.workId, workerId: data.workerId } },
        data: {
            ...(data.unitPrice  !== undefined && { unitPrice: data.unitPrice }),
            ...(data.amount     !== undefined && { amount: data.amount }),
            ...(data.totalPrice !== undefined && { totalPrice: data.totalPrice }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            work:   true,
            worker: true,
        },
    });

    return success(reply, { workWorker }, "WorkWorker successfully updated.");
};

export const deleteWorkWorkerController: TypedHandler<DeleteWorkWorkerType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.workId || !data?.workerId) {
        throw AppError.badRequest("workId and workerId are required");
    }

    const existingWorkWorker = await prisma.workWorker.findUnique({
        where: { workId_workerId: { workId: data.workId, workerId: data.workerId } },
    });
    if (!existingWorkWorker || existingWorkWorker.deletedAt) {
        throw AppError.notFound("WorkWorker not found.");
    }

    const workWorker = await prisma.workWorker.update({
        where: { workId_workerId: { workId: data.workId, workerId: data.workerId } },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { workWorker }, "WorkWorker successfully deleted.");
};

export const getWorkWorkerController: TypedHandler<GetWorkWorkerType> = async (request, reply) => {
    const data = request.body;

    if (!data?.workId || !data?.workerId) {
        throw AppError.badRequest("workId and workerId are required");
    }

    const workWorker = await prisma.workWorker.findUnique({
        where: { workId_workerId: { workId: data.workId, workerId: data.workerId } },
        include: {
            work:   true,
            worker: true,
        },
    });
    if (!workWorker || workWorker.deletedAt) {
        throw AppError.notFound("WorkWorker not found.");
    }

    return success(reply, { workWorker }, "WorkWorker successfully fetched.");
};

export const getWorkWorkersByWorkController: TypedHandler<GetWorkWorkersByWorkType> = async (request, reply) => {
    const data = request.body;

    if (!data?.workId) {
        throw AppError.badRequest("workId is required");
    }

    const workWorkers = await prisma.workWorker.findMany({
        where:   { workId: data.workId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { worker: true },
    });

    return success(reply, { workWorkers }, "WorkWorkers successfully fetched.");
};

export const getAllWorkWorkersController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);

    const where = {
        deletedAt: null,
    };

    const [workWorkers, total] = await Promise.all([
        prisma.workWorker.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                work:   true,
                worker: true,
            },
        }),
        prisma.workWorker.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, workWorkers, meta, "WorkWorkers successfully fetched.");
};
