import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateWorkEquipmentType,
    UpdateWorkEquipmentType,
    DeleteWorkEquipmentType,
    GetWorkEquipmentType,
    GetWorkEquipmentsByWorkType,
} from "./workEquipmentSchema";

export const createWorkEquipmentController: TypedHandler<CreateWorkEquipmentType> = async (request, reply) => {
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

    const existingEquipment = await prisma.equipmentEntity.findFirst({
        where: { id: data.equipmentId, deletedAt: null },
    });
    if (!existingEquipment) {
        throw AppError.notFound("Equipment not found.");
    }

    const existingWorkEquipment = await prisma.workEquipment.findUnique({
        where: { workId_equipmentId: { workId: data.workId, equipmentId: data.equipmentId } },
    });
    if (existingWorkEquipment && !existingWorkEquipment.deletedAt) {
        throw AppError.conflict("Equipment is already assigned to this work.");
    }

    const workEquipment = await prisma.workEquipment.create({
        data: {
            workId:      data.workId,
            equipmentId: data.equipmentId,
            unitPrice:   data.unitPrice,
            amount:      data.amount,
            totalPrice:  data.totalPrice,
            createdAt:   new Date(),
            updatedAt:   new Date(),
            createdBy:   user.id,
            updatedBy:   user.id,
        },
        include: {
            work:      true,
            equipment: true,
        },
    });

    return created(reply, { workEquipment }, "WorkEquipment successfully created.");
};

export const updateWorkEquipmentController: TypedHandler<UpdateWorkEquipmentType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.workId || !data?.equipmentId) {
        throw AppError.badRequest("workId and equipmentId are required");
    }

    const existingWorkEquipment = await prisma.workEquipment.findUnique({
        where: { workId_equipmentId: { workId: data.workId, equipmentId: data.equipmentId } },
    });
    if (!existingWorkEquipment || existingWorkEquipment.deletedAt) {
        throw AppError.notFound("WorkEquipment not found.");
    }

    const workEquipment = await prisma.workEquipment.update({
        where: { workId_equipmentId: { workId: data.workId, equipmentId: data.equipmentId } },
        data: {
            ...(data.unitPrice  !== undefined && { unitPrice: data.unitPrice }),
            ...(data.amount     !== undefined && { amount: data.amount }),
            ...(data.totalPrice !== undefined && { totalPrice: data.totalPrice }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            work:      true,
            equipment: true,
        },
    });

    return success(reply, { workEquipment }, "WorkEquipment successfully updated.");
};

export const deleteWorkEquipmentController: TypedHandler<DeleteWorkEquipmentType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.workId || !data?.equipmentId) {
        throw AppError.badRequest("workId and equipmentId are required");
    }

    const existingWorkEquipment = await prisma.workEquipment.findUnique({
        where: { workId_equipmentId: { workId: data.workId, equipmentId: data.equipmentId } },
    });
    if (!existingWorkEquipment || existingWorkEquipment.deletedAt) {
        throw AppError.notFound("WorkEquipment not found.");
    }

    const workEquipment = await prisma.workEquipment.update({
        where: { workId_equipmentId: { workId: data.workId, equipmentId: data.equipmentId } },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { workEquipment }, "WorkEquipment successfully deleted.");
};

export const getWorkEquipmentController: TypedHandler<GetWorkEquipmentType> = async (request, reply) => {
    const data = request.body;

    if (!data?.workId || !data?.equipmentId) {
        throw AppError.badRequest("workId and equipmentId are required");
    }

    const workEquipment = await prisma.workEquipment.findUnique({
        where: { workId_equipmentId: { workId: data.workId, equipmentId: data.equipmentId } },
        include: {
            work:      true,
            equipment: true,
        },
    });
    if (!workEquipment || workEquipment.deletedAt) {
        throw AppError.notFound("WorkEquipment not found.");
    }

    return success(reply, { workEquipment }, "WorkEquipment successfully fetched.");
};

export const getWorkEquipmentsByWorkController: TypedHandler<GetWorkEquipmentsByWorkType> = async (request, reply) => {
    const data = request.body;

    if (!data?.workId) {
        throw AppError.badRequest("workId is required");
    }

    const workEquipments = await prisma.workEquipment.findMany({
        where:   { workId: data.workId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { equipment: true },
    });

    return success(reply, { workEquipments }, "WorkEquipments successfully fetched.");
};

export const getAllWorkEquipmentsController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);

    const where = {
        deletedAt: null,
    };

    const [workEquipments, total] = await Promise.all([
        prisma.workEquipment.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                work:      true,
                equipment: true,
            },
        }),
        prisma.workEquipment.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, workEquipments, meta, "WorkEquipments successfully fetched.");
};
