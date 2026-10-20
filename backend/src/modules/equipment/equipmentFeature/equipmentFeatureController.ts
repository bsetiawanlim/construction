import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import { CreateEquipmentFeatureType, UpdateEquipmentFeatureType } from "./equipmentFeatureSchema";

export async function createEquipmentFeatureController(
    request: FastifyRequest<{ Body: CreateEquipmentFeatureType }>,
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

    const feature = await prisma.equipmentFeature.create({
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

    return created(reply, feature, "Equipment feature successfully created.");
}

export async function updateEquipmentFeatureController(
    request: FastifyRequest<{ Body: UpdateEquipmentFeatureType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentFeature.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment feature not found.");
    }

    const feature = await prisma.equipmentFeature.update({
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

    return success(reply, feature, "Equipment feature successfully updated.");
}

export async function deleteEquipmentFeatureController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentFeature.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment feature not found.");
    }

    const feature = await prisma.equipmentFeature.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, feature, "Equipment feature successfully deleted.");
}

export async function getEquipmentFeatureController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const feature = await prisma.equipmentFeature.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { equipmentEntity: true },
    });

    if (!feature) {
        throw AppError.notFound("Equipment feature not found.");
    }

    return success(reply, feature, "Equipment feature successfully retrieved.");
}

export async function getEquipmentFeaturesByEntityController(
    request: FastifyRequest<{ Body: { equipmentEntityId: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const features = await prisma.equipmentFeature.findMany({
        where: { equipmentEntityId: data.equipmentEntityId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { equipmentEntity: true },
    });

    return success(reply, features, "Equipment features successfully retrieved.", 200, {
        features
    });
}
