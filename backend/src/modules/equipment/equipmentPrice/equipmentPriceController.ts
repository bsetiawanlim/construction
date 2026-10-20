import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import {
    CreateEquipmentPriceType,
    UpdateEquipmentPriceType,
    DeleteEquipmentPriceType,
    GetEquipmentPriceType,
    GetEquipmentPricesByEntityType,
} from "./equipmentPriceSchema";

export async function createEquipmentPriceController(
    request: FastifyRequest<{ Body: CreateEquipmentPriceType }>,
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

    const price = await prisma.equipmentPrice.create({
        data: {
            equipmentEntityId: data.equipmentEntityId,
            priceType:         data.priceType,
            amount:            data.amount,
            currency:          data.currency || "IDR",
            startDate:         data.startDate ? new Date(data.startDate) : new Date(),
            endDate:           data.endDate ? new Date(data.endDate) : null,
            notes:             data.notes ?? null,
            createdBy:         user.id,
            updatedBy:         user.id,
        },
        include: { equipmentEntity: true },
    });

    return created(reply, price, "Equipment price successfully recorded.");
}

export async function updateEquipmentPriceController(
    request: FastifyRequest<{ Body: UpdateEquipmentPriceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentPrice.findFirst({
        where: { id: data.id, deletedAt: null }
    });
    if (!existing) {
        throw AppError.notFound("Equipment price not found.");
    }

    const price = await prisma.equipmentPrice.update({
        where: { id: data.id },
        data: {
            ...(data.priceType !== undefined && { priceType: data.priceType }),
            ...(data.amount !== undefined && { amount: data.amount }),
            ...(data.currency !== undefined && { currency: data.currency }),
            ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
            ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
            ...(data.notes !== undefined && { notes: data.notes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { equipmentEntity: true },
    });

    return success(reply, price, "Equipment price successfully updated.");
}

export async function deleteEquipmentPriceController(
    request: FastifyRequest<{ Body: DeleteEquipmentPriceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentPrice.findFirst({
        where: { id: data.id, deletedAt: null }
    });
    if (!existing) {
        throw AppError.notFound("Equipment price not found.");
    }

    const price = await prisma.equipmentPrice.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedBy: user.id,
        }
    });

    return success(reply, price, "Equipment price successfully removed.");
}

export async function getEquipmentPriceController(
    request: FastifyRequest<{ Body: GetEquipmentPriceType }>,
    reply: FastifyReply
) {
    const data = request.body;

    const price = await prisma.equipmentPrice.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { equipmentEntity: true }
    });
    if (!price) {
        throw AppError.notFound("Equipment price not found.");
    }

    return success(reply, price, "Equipment price successfully fetched.");
}

export async function getEquipmentPricesByEntityController(
    request: FastifyRequest<{ Body: GetEquipmentPricesByEntityType }>,
    reply: FastifyReply
) {
    const data = request.body;

    const prices = await prisma.equipmentPrice.findMany({
        where: {
            equipmentEntityId: data.equipmentEntityId,
            deletedAt: null
        },
        orderBy: { startDate: "desc" },
    });

    return success(reply, prices, "Equipment prices successfully fetched.");
}
