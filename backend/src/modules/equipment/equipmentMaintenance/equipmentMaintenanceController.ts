import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import { CreateEquipmentMaintenanceType, UpdateEquipmentMaintenanceType } from "./equipmentMaintenanceSchema";

export async function createEquipmentMaintenanceController(
    request: FastifyRequest<{ Body: CreateEquipmentMaintenanceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const entityExists = await prisma.equipmentEntity.findFirst({
        where: { id: data.equipmentEntityId, deletedAt: null }
    });
    if (!entityExists) {
        throw AppError.notFound("Equipment entity not found.");
    }

    const maintenance = await prisma.equipmentMaintenance.create({
        data: {
            name: data.name,
            value: data.value ?? null,
            unitId: data.unitId ?? null,
            equipmentEntityId: data.equipmentEntityId,
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: { equipmentEntity: true },
    });

    return created(reply, maintenance, "Equipment maintenance record successfully created.");
}

export async function updateEquipmentMaintenanceController(
    request: FastifyRequest<{ Body: UpdateEquipmentMaintenanceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentMaintenance.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment maintenance record not found.");
    }

    const maintenance = await prisma.equipmentMaintenance.update({
        where: { id: data.id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.value !== undefined && { value: data.value }),
            ...(data.unitId !== undefined && { unitId: data.unitId }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { equipmentEntity: true },
    });

    return success(reply, maintenance, "Equipment maintenance record successfully updated.");
}

export async function deleteEquipmentMaintenanceController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentMaintenance.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment maintenance record not found.");
    }

    const maintenance = await prisma.equipmentMaintenance.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, maintenance, "Equipment maintenance record successfully deleted.");
}

export async function getEquipmentMaintenanceController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const maintenance = await prisma.equipmentMaintenance.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { equipmentEntity: true },
    });

    if (!maintenance) {
        throw AppError.notFound("Equipment maintenance record not found.");
    }

    return success(reply, maintenance, "Equipment maintenance record successfully retrieved.");
}

export async function getEquipmentMaintenanceByEntityController(
    request: FastifyRequest<{ Body: { equipmentEntityId: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const maintenances = await prisma.equipmentMaintenance.findMany({
        where: { equipmentEntityId: data.equipmentEntityId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { equipmentEntity: true },
    });

    return success(reply, maintenances, "Equipment maintenance records successfully retrieved.", 200, {
        maintenances
    });
}
