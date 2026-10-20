import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateItemType,
    UpdateItemType,
    DeleteItemType,
    GetItemType,
    GetItemsByProductType,
} from "./itemSchema";

export const addItemController: TypedHandler<CreateItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingProduct = await prisma.product.findFirst({
        where: { id: data.productId, deletedAt: null },
    });
    if (!existingProduct) {
        throw AppError.notFound("Product not found!");
    }

    const resolvedUnitId = data.unitId ?? data.unit ?? undefined;

    const existingItem = await prisma.item.findFirst({
        where: {
            productId: data.productId,
            unitId:    resolvedUnitId ?? null,
            deletedAt: null,
        },
    });
    if (existingItem) {
        throw AppError.conflict("Item already exists for this product and unit!");
    }

    const item = await prisma.item.create({
        data: {
            productId:   data.productId,
            description: data.description ?? undefined,
            unitId:      resolvedUnitId,
            unitPrice:   data.unitPrice,
            createdAt:   new Date(),
            updatedAt:   new Date(),
            createdBy:   user.id,
            updatedBy:   user.id,
        },
        include: { product: true, unit: true },
    });

    return created(reply, { item }, "Item successfully created.");
};

export const updateItemController: TypedHandler<UpdateItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Item id is required");
    }

    const item = await prisma.item.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!item) {
        throw AppError.notFound("Item not found!");
    }

    const resolvedUnitId = data.unitId !== undefined ? data.unitId : data.unit;

    const updatedItem = await prisma.item.update({
        where: { id: data.id },
        data: {
            ...(data.description !== undefined && { description: data.description }),
            ...(resolvedUnitId   !== undefined && { unitId: resolvedUnitId }),
            ...(data.unitPrice   !== undefined && { unitPrice: data.unitPrice }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { product: true, unit: true },
    });

    return success(reply, { updatedItem }, "Item successfully updated.");
};

export const deleteItemController: TypedHandler<DeleteItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Item id is required");
    }

    const item = await prisma.item.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!item) {
        throw AppError.notFound("Item not found!");
    }

    const updatedItem = await prisma.item.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { updatedItem }, "Item successfully deleted.");
};

export const getItemController: TypedHandler<GetItemType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Item id is required");
    }

    const item = await prisma.item.findFirst({
        where:   { id: data.id, deletedAt: null },
        include: {
            product:  true,
            unit:     true,
            workItem: { include: { work: true } },
        },
    });
    if (!item) {
        throw AppError.notFound("Item not found!");
    }

    return success(reply, { item }, "Item successfully retrieved.");
};

export const getItemsByProductController: TypedHandler<GetItemsByProductType> = async (request, reply) => {
    const data = request.body;

    if (!data?.productId) {
        throw AppError.badRequest("productId is required");
    }

    const items = await prisma.item.findMany({
        where:   { productId: data.productId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { product: true, unit: true },
    });

    return success(reply, { items }, "Items successfully retrieved.");
};

export const getAllItemsController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["description"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [items, total] = await Promise.all([
        prisma.item.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { product: true, unit: true },
        }),
        prisma.item.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, items, meta, "Items successfully retrieved.");
};