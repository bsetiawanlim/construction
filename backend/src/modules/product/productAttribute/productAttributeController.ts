import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationParams } from "../../../utils/pagination";
import {
    CreateProductAttributeType,
    UpdateProductAttributeType,
    DeleteProductAttributeType
} from "./productAttributeSchema";

export async function createProductAttributeController(
    request: FastifyRequest<{ Body: CreateProductAttributeType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingAttribute = await prisma.productAttribute.findFirst({
        where: { name: data.name, deletedAt: null },
    });
    if (existingAttribute) {
        throw AppError.conflict("Product attribute with this name already exists.");
    }

    const attribute = await prisma.productAttribute.create({
        data: {
            name: data.name,
            description: data.description ?? null,
            type: data.type,
            options: data.options ?? null,
            createdBy: user.id,
            updatedBy: user.id,
        },
    });

    return created(reply, attribute, "Product attribute successfully created.");
}

export async function updateProductAttributeController(
    request: FastifyRequest<{ Body: UpdateProductAttributeType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingAttribute = await prisma.productAttribute.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingAttribute) {
        throw AppError.notFound("Product attribute not found.");
    }

    // Check name conflict with other attributes
    if (data.name && data.name !== existingAttribute.name) {
        const nameConflict = await prisma.productAttribute.findFirst({
            where: { name: data.name, deletedAt: null, id: { not: data.id } },
        });
        if (nameConflict) {
            throw AppError.conflict("A product attribute with this name already exists.");
        }
    }

    const attribute = await prisma.productAttribute.update({
        where: { id: data.id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.type !== undefined && { type: data.type }),
            ...(data.options !== undefined && { options: data.options }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, attribute, "Product attribute successfully updated.");
}

export async function deleteProductAttributeController(
    request: FastifyRequest<{ Body: DeleteProductAttributeType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data?.id) {
        throw AppError.badRequest("Attribute id is required.");
    }

    const existingAttribute = await prisma.productAttribute.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingAttribute) {
        throw AppError.notFound("Product attribute not found.");
    }

    // Block deletion if attribute values exist
    const usedValues = await prisma.productAttributeValue.findMany({
        where: { attributeId: data.id, deletedAt: null },
    });
    if (usedValues.length > 0) {
        throw AppError.badRequest("Attribute is in use by products. Remove attribute values first.", {
            count: usedValues.length
        });
    }

    const attribute = await prisma.productAttribute.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, attribute, "Product attribute successfully deleted.");
}

export async function getProductAttributesController(
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

    const searchFilter = buildSearchFilter(params.search, ["name", "description", "type"]);
    const where: any = {
        deletedAt: null,
        ...(searchFilter ? { OR: searchFilter } : {})
    };

    const [attributes, total] = await Promise.all([
        prisma.productAttribute.findMany({
            where,
            skip,
            take,
            orderBy,
        }),
        prisma.productAttribute.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, attributes, meta, "Product attributes successfully fetched.", "attributes");
}
