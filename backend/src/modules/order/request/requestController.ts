import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateRequestSourceType,
    DeleteRequestSourceType,
    CreateRequestType,
    UpdateRequestType,
    DeleteRequestType,
    GetRequestType,
    CreateRequestProductType,
    UpdateRequestProductType,
    DeleteRequestProductType,
    GetRequestProductType,
} from "./requestSchema";

// ── Request Source ────────────────────────────────────────────────────

export const createRequestSourceController: TypedHandler<CreateRequestSourceType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const requestSource = await prisma.requestSource.create({
        data: {
            name:          data.name,
            requestOrigin: data.requestOrigin,
            createdBy:     user.id,
            updatedBy:     user.id,
        },
    });

    return created(reply, { requestSource }, "Request source successfully created.");
};

export const deleteRequestSourceController: TypedHandler<DeleteRequestSourceType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Request source id is required");
    }

    const existing = await prisma.requestSource.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Request source not found.");
    }

    await prisma.requestSource.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, null, "Request source successfully deleted.");
};

export const getRequestSourcesController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["name", "requestOrigin"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [requestSources, total] = await Promise.all([
        prisma.requestSource.findMany({
            where,
            skip,
            take: limit,
            orderBy: { id: "asc" },
        }),
        prisma.requestSource.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, requestSources, meta, "Request sources successfully fetched.");
};

// ── Request ───────────────────────────────────────────────────────────

export const createRequestController: TypedHandler<CreateRequestType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingSource = await prisma.requestSource.findFirst({
        where: { id: data.sourceId, deletedAt: null },
    });
    if (!existingSource) {
        throw AppError.notFound("Request source not found.");
    }

    const existingNumber = await prisma.request.findFirst({
        where: { number: data.number, deletedAt: null },
    });
    if (existingNumber) {
        throw AppError.conflict("Request number already exists.");
    }

    const req = await prisma.request.create({
        data: {
            sourceId:  data.sourceId,
            number:    data.number,
            title:     data.title,
            date:      data.date ? new Date(data.date) : new Date(),
            dueDate:   new Date(data.dueDate),
            status:    data.status,
            notes:     data.notes ?? undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: { requestSource: true, requestProducts: true },
    });

    return created(reply, { request: req }, "Request successfully created.");
};

export const updateRequestController: TypedHandler<UpdateRequestType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Request id is required");
    }

    const existing = await prisma.request.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Request not found.");
    }

    if (data.sourceId !== undefined) {
        const existingSource = await prisma.requestSource.findFirst({
            where: { id: data.sourceId, deletedAt: null },
        });
        if (!existingSource) {
            throw AppError.notFound("Request source not found.");
        }
    }

    const req = await prisma.request.update({
        where: { id: data.id },
        data: {
            ...(data.sourceId !== undefined && { sourceId: data.sourceId }),
            ...(data.title    !== undefined && { title: data.title }),
            ...(data.date     !== undefined && { date: new Date(data.date) }),
            ...(data.dueDate  !== undefined && { dueDate: new Date(data.dueDate) }),
            ...(data.status   !== undefined && { status: data.status }),
            ...(data.notes    !== undefined && { notes: data.notes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { requestSource: true, requestProducts: true },
    });

    return success(reply, { request: req }, "Request successfully updated.");
};

export const deleteRequestController: TypedHandler<DeleteRequestType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Request id is required");
    }

    const existing = await prisma.request.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Request not found.");
    }

    const req = await prisma.request.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { request: req }, "Request successfully deleted.");
};

export const getRequestController: TypedHandler<GetRequestType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Request id is required");
    }

    const req = await prisma.request.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            requestSource:   true,
            requestProducts: { include: { requestProduct: true } },
        },
    });

    if (!req) {
        throw AppError.notFound("Request not found.");
    }

    return success(reply, { request: req }, "Request successfully fetched.");
};

export const getRequestsController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["number", "title", "notes"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [requests, total] = await Promise.all([
        prisma.request.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { requestSource: true, requestProducts: true },
        }),
        prisma.request.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, requests, meta, "Requests successfully fetched.");
};

// ── Request Product ───────────────────────────────────────────────────

export const createRequestProductController: TypedHandler<CreateRequestProductType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingRequest = await prisma.request.findFirst({
        where: { id: data.requestId, deletedAt: null },
    });
    if (!existingRequest) {
        throw AppError.notFound("Request not found.");
    }

    const existingProduct = await prisma.product.findFirst({
        where: { id: data.productId, deletedAt: null },
    });
    if (!existingProduct) {
        throw AppError.notFound("Product not found.");
    }

    const duplicate = await prisma.requestProduct.findFirst({
        where: { requestId: data.requestId, productId: data.productId, deletedAt: null },
    });
    if (duplicate) {
        throw AppError.conflict("Product already added to this request.");
    }

    const requestProduct = await prisma.requestProduct.create({
        data: {
            requestId: data.requestId,
            productId: data.productId,
            unitId:    data.unitId ?? undefined,
            quantity:  data.quantity,
            notes:     data.notes ?? undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: { requestProduct: true },
    });

    return created(reply, { requestProduct }, "Request product successfully added.");
};

export const updateRequestProductController: TypedHandler<UpdateRequestProductType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Request product id is required");
    }

    const existing = await prisma.requestProduct.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Request product not found.");
    }

    const requestProduct = await prisma.requestProduct.update({
        where: { id: data.id },
        data: {
            ...(data.unitId   !== undefined && { unitId: data.unitId }),
            ...(data.quantity !== undefined && { quantity: data.quantity }),
            ...(data.notes    !== undefined && { notes: data.notes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { requestProduct: true },
    });

    return success(reply, { requestProduct }, "Request product successfully updated.");
};

export const deleteRequestProductController: TypedHandler<DeleteRequestProductType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Request product id is required");
    }

    const existing = await prisma.requestProduct.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Request product not found.");
    }

    const requestProduct = await prisma.requestProduct.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { requestProduct }, "Request product successfully deleted.");
};

export const getRequestProductsByRequestController: TypedHandler<GetRequestProductType> = async (request, reply) => {
    const data = request.body;

    if (!data?.requestId) {
        throw AppError.badRequest("requestId is required");
    }

    const requestProducts = await prisma.requestProduct.findMany({
        where: { requestId: data.requestId, deletedAt: null },
        include: { requestProduct: true },
        orderBy: { createdAt: "asc" },
    });

    return success(reply, { requestProducts }, "Request products successfully fetched.");
};
