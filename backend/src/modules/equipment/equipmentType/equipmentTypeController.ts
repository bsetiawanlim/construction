import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { CreateEquipmentTypeType, UpdateEquipmentTypeType } from "./equipmentTypeSchema";

export async function createEquipmentTypeController(
    request: FastifyRequest<{ Body: CreateEquipmentTypeType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const equipmentType = await prisma.equipmentType.create({
        data: {
            name: data.name,
            description: data.description ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
            equipmentTypeCreatedBy: { connect: { id: user.id } },
            equipmentTypeUpdatedBy: { connect: { id: user.id } },
        },
        include: { equipmentModel: true },
    });

    return created(reply, equipmentType, "Equipment type successfully created.");
}

export async function updateEquipmentTypeController(
    request: FastifyRequest<{ Body: UpdateEquipmentTypeType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentType.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment type not found.");
    }

    const equipmentType = await prisma.equipmentType.update({
        where: { id: data.id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { equipmentModel: true },
    });

    return success(reply, equipmentType, "Equipment type successfully updated.");
}

export async function deleteEquipmentTypeController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentType.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment type not found.");
    }

    const equipmentType = await prisma.equipmentType.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, equipmentType, "Equipment type successfully deleted.");
}

export async function getEquipmentTypeController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const equipmentType = await prisma.equipmentType.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { equipmentModel: true },
    });

    if (!equipmentType) {
        throw AppError.notFound("Equipment type not found.");
    }

    return success(reply, equipmentType, "Equipment type successfully retrieved.");
}

export async function getAllEquipmentTypesController(
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

    const [equipmentTypes, total] = await Promise.all([
        prisma.equipmentType.findMany({
            where,
            skip,
            take,
            orderBy,
            include: { equipmentModel: true },
        }),
        prisma.equipmentType.count({ where })
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, equipmentTypes, meta, "Equipment types successfully retrieved.", "equipmentTypes");
}
