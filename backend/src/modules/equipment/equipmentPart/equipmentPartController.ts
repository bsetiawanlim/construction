import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { CreateEquipmentPartType, UpdateEquipmentPartType } from "./equipmentPartSchema";

export async function createEquipmentPartController(
    request: FastifyRequest<{ Body: CreateEquipmentPartType }>,
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

    const part = await prisma.equipmentPart.create({
        data: {
            partNumber: data.partNumber ?? null,
            name: data.name,
            otherName: data.otherName ?? null,
            description: data.description ?? null,
            unit: data.unit ?? null,
            lifeSpan: data.lifeSpan ?? null,
            lifeSpanUnitId: data.lifeSpanUnitId ?? null,
            equipmentModelId: data.equipmentModelId,
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: { equipmentModel: true },
    });

    return created(reply, part, "Equipment part successfully created.");
}

export async function updateEquipmentPartController(
    request: FastifyRequest<{ Body: UpdateEquipmentPartType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentPart.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment part not found.");
    }

    const part = await prisma.equipmentPart.update({
        where: { id: data.id },
        data: {
            ...(data.partNumber !== undefined && { partNumber: data.partNumber }),
            ...(data.name !== undefined && { name: data.name }),
            ...(data.otherName !== undefined && { otherName: data.otherName }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.unit !== undefined && { unit: data.unit }),
            ...(data.lifeSpan !== undefined && { lifeSpan: data.lifeSpan }),
            ...(data.lifeSpanUnitId !== undefined && { lifeSpanUnitId: data.lifeSpanUnitId }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { equipmentModel: true },
    });

    return success(reply, part, "Equipment part successfully updated.");
}

export async function deleteEquipmentPartController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentPart.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment part not found.");
    }

    const part = await prisma.equipmentPart.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, part, "Equipment part successfully deleted.");
}

export async function getEquipmentPartController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const part = await prisma.equipmentPart.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { equipmentModel: true },
    });

    if (!part) {
        throw AppError.notFound("Equipment part not found.");
    }

    return success(reply, part, "Equipment part successfully retrieved.");
}

export async function getEquipmentPartsByModelController(
    request: FastifyRequest<{ Body: { equipmentModelId: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const parts = await prisma.equipmentPart.findMany({
        where: { equipmentModelId: data.equipmentModelId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { equipmentModel: true },
    });

    return success(reply, parts, "Equipment parts successfully retrieved.", 200, {
        parts
    });
}

export async function getAllEquipmentPartsController(
    request: FastifyRequest<{ Querystring: PaginationParams; Body?: PaginationParams }>,
    reply: FastifyReply
) {
    const params = (request.query && Object.keys(request.query).length > 0)
        ? request.query
        : (request.body || {});

    const { page, limit, skip, take, orderBy } = buildPaginationQuery(params, {
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc"
    });

    const searchFilter = buildSearchFilter(params.search, [
        "name",
        "partNumber",
        "otherName",
        "description"
    ]);

    const where: any = {
        deletedAt: null,
        ...(searchFilter ? { OR: searchFilter } : {})
    };

    const [parts, total] = await Promise.all([
        prisma.equipmentPart.findMany({
            where,
            skip,
            take,
            orderBy,
            include: { equipmentModel: true },
        }),
        prisma.equipmentPart.count({ where })
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, parts, meta, "Equipment parts successfully retrieved.", "parts");
}
