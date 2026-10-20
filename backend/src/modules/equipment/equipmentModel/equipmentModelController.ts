import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { CreateEquipmentModelType, UpdateEquipmentModelType } from "./equipmentModelSchema";

export async function createEquipmentModelController(
    request: FastifyRequest<{ Body: CreateEquipmentModelType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const typeExists = await prisma.equipmentType.findFirst({
        where: { id: data.typeId, deletedAt: null }
    });
    if (!typeExists) {
        throw AppError.notFound("Equipment type not found.");
    }

    const equipmentModel = await prisma.equipmentModel.create({
        data: {
            name: data.name,
            description: data.description ?? null,
            typeId: data.typeId,
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: {
            type: true,
            equipment: true,
            equipmentModelFeature: true,
            equipmentParts: true,
        },
    });

    return created(reply, equipmentModel, "Equipment model successfully created.");
}

export async function updateEquipmentModelController(
    request: FastifyRequest<{ Body: UpdateEquipmentModelType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentModel.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment model not found.");
    }

    if (data.typeId) {
        const typeExists = await prisma.equipmentType.findFirst({ where: { id: data.typeId, deletedAt: null } });
        if (!typeExists) {
            throw AppError.notFound("Equipment type not found.");
        }
    }

    const equipmentModel = await prisma.equipmentModel.update({
        where: { id: data.id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.typeId !== undefined && { typeId: data.typeId }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            type: true,
            equipment: true,
            equipmentModelFeature: true,
            equipmentParts: true,
        },
    });

    return success(reply, equipmentModel, "Equipment model successfully updated.");
}

export async function deleteEquipmentModelController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentModel.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment model not found.");
    }

    const equipmentModel = await prisma.equipmentModel.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, equipmentModel, "Equipment model successfully deleted.");
}

export async function getEquipmentModelController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const equipmentModel = await prisma.equipmentModel.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            type: true,
            equipment: true,
            equipmentModelFeature: true,
            equipmentParts: true,
        },
    });

    if (!equipmentModel) {
        throw AppError.notFound("Equipment model not found.");
    }

    return success(reply, equipmentModel, "Equipment model successfully retrieved.");
}

export async function getEquipmentModelsByTypeController(
    request: FastifyRequest<{ Body: { typeId: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const equipmentModels = await prisma.equipmentModel.findMany({
        where: { typeId: data.typeId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
            type: true,
            equipment: true,
            equipmentModelFeature: true,
            equipmentParts: true,
        },
    });

    return success(reply, equipmentModels, "Equipment models successfully retrieved.", 200, {
        equipmentModels
    });
}

export async function getAllEquipmentModelsController(
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

    const searchFilter = buildSearchFilter(params.search, ["name", "description"]);
    const where: any = {
        deletedAt: null,
        ...(searchFilter ? { OR: searchFilter } : {})
    };

    const [equipmentModels, total] = await Promise.all([
        prisma.equipmentModel.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
                type: true,
                equipment: true,
                equipmentModelFeature: true,
                equipmentParts: true,
            },
        }),
        prisma.equipmentModel.count({ where })
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, equipmentModels, meta, "Equipment models successfully retrieved.", "equipmentModels");
}
