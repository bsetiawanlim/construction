import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import { CreateEquipmentModelFeatureType, UpdateEquipmentModelFeatureType } from "./equipmentModelFeatureSchema";

export async function createEquipmentModelFeatureController(
    request: FastifyRequest<{ Body: CreateEquipmentModelFeatureType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const modelExists = await prisma.equipmentModel.findFirst({
        where: { id: data.equipmentModelId, deletedAt: null }
    });
    if (!modelExists) {
        throw AppError.notFound("Equipment model not found.");
    }

    const feature = await prisma.equipmentModelFeature.create({
        data: {
            name: data.name,
            value: data.value ?? null,
            unitId: data.unitId ?? null,
            equipmentModelId: data.equipmentModelId,
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: { equipmentModel: true },
    });

    return created(reply, feature, "Equipment model feature successfully created.");
}

export async function updateEquipmentModelFeatureController(
    request: FastifyRequest<{ Body: UpdateEquipmentModelFeatureType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentModelFeature.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment model feature not found.");
    }

    const feature = await prisma.equipmentModelFeature.update({
        where: { id: data.id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.value !== undefined && { value: data.value }),
            ...(data.unitId !== undefined && { unitId: data.unitId }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { equipmentModel: true },
    });

    return success(reply, feature, "Equipment model feature successfully updated.");
}

export async function deleteEquipmentModelFeatureController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentModelFeature.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment model feature not found.");
    }

    const feature = await prisma.equipmentModelFeature.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, feature, "Equipment model feature successfully deleted.");
}

export async function getEquipmentModelFeatureController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const feature = await prisma.equipmentModelFeature.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { equipmentModel: true },
    });

    if (!feature) {
        throw AppError.notFound("Equipment model feature not found.");
    }

    return success(reply, feature, "Equipment model feature successfully retrieved.");
}

export async function getEquipmentModelFeaturesByModelController(
    request: FastifyRequest<{ Body: { equipmentModelId: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const features = await prisma.equipmentModelFeature.findMany({
        where: { equipmentModelId: data.equipmentModelId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { equipmentModel: true },
    });

    return success(reply, features, "Equipment model features successfully retrieved.", 200, {
        features
    });
}
