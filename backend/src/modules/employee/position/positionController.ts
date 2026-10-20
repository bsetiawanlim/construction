import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { extractFieldForUpdate } from "../../../utils/prismaUtils";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import { positionType, deletePositionType } from "./positionSchema";

export async function createPositionController(
    request: FastifyRequest<{ Body: positionType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existingPosition = await prisma.position.findFirst({
        where: {
            name: data.name,
            deletedAt: null
        }
    });

    if (existingPosition) {
        throw AppError.conflict("Position with this name already exists.");
    }

    const position = await prisma.position.create({
        data: {
            name: data.name,
            description: data.description ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user.id,
            updatedBy: user.id,
        }
    });

    return created(reply, position, "Position successfully created.");
}

export async function deletePositionController(
    request: FastifyRequest<{ Body: deletePositionType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const existingPosition = await prisma.position.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!existingPosition) {
        throw AppError.notFound("Position not found!");
    }

    const position = await prisma.position.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        }
    });

    return success(reply, position, "Position successfully deleted.");
}

export async function updatePositionController(
    request: FastifyRequest<{ Body: Partial<positionType> & { id: number } }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }

    const position = await prisma.position.findFirst({
        where: {
            id: data.id,
            deletedAt: null
        }
    });

    if (!position) {
        throw AppError.notFound("Position not found!");
    }

    if (data.name && data.name !== position.name) {
        const nameConflict = await prisma.position.findFirst({
            where: {
                name: data.name,
                deletedAt: null,
                id: { not: data.id }
            }
        });
        if (nameConflict) {
            throw AppError.conflict("Another position with this name already exists.");
        }
    }

    const fields = extractFieldForUpdate(position, data);
    if (!fields) {
        return success(reply, position, "No fields to update.");
    }

    const updatedPosition = await prisma.position.update({
        where: { id: data.id },
        data: {
            ...fields,
            updatedAt: new Date(),
            positionUpdatedBy: { connect: { id: user.id } },
        }
    });

    return success(reply, updatedPosition, "Position successfully updated.");
}

export async function getPositionsController(
    request: FastifyRequest<{ Querystring: PaginationParams; Body?: PaginationParams }>,
    reply: FastifyReply
) {
    const params = (request.query && Object.keys(request.query).length > 0)
        ? request.query
        : (request.body || {});

    const { page, limit, skip, take, orderBy } = buildPaginationQuery(params, {
        defaultSortBy: "name",
        defaultSortOrder: "asc"
    });

    const searchFilter = buildSearchFilter(params.search, ["name", "description"]);
    const where: any = {
        deletedAt: null,
        ...(searchFilter ? { OR: searchFilter } : {})
    };

    const [positions, total] = await Promise.all([
        prisma.position.findMany({
            where,
            skip,
            take,
            orderBy
        }),
        prisma.position.count({ where })
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, positions, meta, "Positions successfully fetched.", "positions");
}

export async function getPositionById(positionId: number) {
    return await prisma.position.findUnique({
        where: {
            id: positionId,
            deletedAt: null
        }
    });
}
