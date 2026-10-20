import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { CreateEquipmentBrandType, UpdateEquipmentBrandType } from "./equipmentBrandSchema";

export async function createEquipmentBrandController(
    request: FastifyRequest<{ Body: CreateEquipmentBrandType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const equipmentBrand = await prisma.equipmentBrand.create({
        data: {
            name: data.name,
            description: data.description ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
            equipmentBrandCreatedBy: { connect: { id: user.id } },
            equipmentBrandUpdatedBy: { connect: { id: user.id } },
        },
        include: { equipment: true },
    });

    return created(reply, equipmentBrand, "Equipment brand successfully created.");
}

export async function updateEquipmentBrandController(
    request: FastifyRequest<{ Body: UpdateEquipmentBrandType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentBrand.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment brand not found.");
    }

    const equipmentBrand = await prisma.equipmentBrand.update({
        where: { id: data.id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { equipment: true },
    });

    return success(reply, equipmentBrand, "Equipment brand successfully updated.");
}

export async function deleteEquipmentBrandController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existing = await prisma.equipmentBrand.findFirst({ where: { id: data.id, deletedAt: null } });
    if (!existing) {
        throw AppError.notFound("Equipment brand not found.");
    }

    const equipmentBrand = await prisma.equipmentBrand.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, equipmentBrand, "Equipment brand successfully deleted.");
}

export async function getEquipmentBrandController(
    request: FastifyRequest<{ Body: { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const equipmentBrand = await prisma.equipmentBrand.findFirst({
        where: { id: data.id, deletedAt: null },
        include: { equipment: true },
    });

    if (!equipmentBrand) {
        throw AppError.notFound("Equipment brand not found.");
    }

    return success(reply, equipmentBrand, "Equipment brand successfully retrieved.");
}

export async function getAllEquipmentBrandsController(
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

    const [equipmentBrands, total] = await Promise.all([
        prisma.equipmentBrand.findMany({
            where,
            skip,
            take,
            orderBy,
            include: { equipment: true },
        }),
        prisma.equipmentBrand.count({ where })
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, equipmentBrands, meta, "Equipment brands successfully retrieved.", "equipmentBrands");
}
