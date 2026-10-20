import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateRfqType,
    CreateRfqWithProductsType,
    UpdateRfqType,
    DeleteRfqType,
    GetRfqType,
} from "./rfqSchema";

export const createRfqWithProductsController: TypedHandler<CreateRfqWithProductsType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    // Validate vendor
    const existingVendor = await prisma.vendor.findFirst({
        where: { id: data.vendorId, deletedAt: null },
    });
    if (!existingVendor) {
        throw AppError.notFound("Vendor not found.");
    }

    // Unique RFQ number
    const existingNumber = await prisma.rfq.findFirst({
        where: { number: data.number },
    });
    if (existingNumber) {
        throw AppError.conflict("RFQ number already exists.");
    }

    // Unique reply number
    if (data.replyNumber) {
        const existingReplyNumber = await prisma.rfq.findFirst({
            where: { replyNumber: data.replyNumber },
        });
        if (existingReplyNumber) {
            throw AppError.conflict("Reply number already exists.");
        }
    }

    // Validate every product exists
    const productIds: number[] = data.products.map((p) => p.productId);
    const foundProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
        select: { id: true },
    });
    const foundIds = new Set(foundProducts.map((p) => p.id));
    const missing = productIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
        throw AppError.notFound(`Products not found: ${missing.join(", ")}`);
    }

    // Atomic transaction — create RFQ + all products together
    const rfq = await prisma.$transaction(async (tx) => {
        const createdRfq = await tx.rfq.create({
            data: {
                vendorId:         data.vendorId,
                number:           data.number,
                title:            data.title,
                date:             data.date ? new Date(data.date) : new Date(),
                dueDate:          new Date(data.dueDate),
                status:           data.status,
                notes:            data.notes ?? undefined,
                replyNumber:      data.replyNumber ?? undefined,
                replyDate:        data.replyDate ? new Date(data.replyDate) : undefined,
                replyExpiredDate: data.replyExpiredDate ? new Date(data.replyExpiredDate) : undefined,
                replyNotes:       data.replyNotes ?? "",
                createdAt:        new Date(),
                updatedAt:        new Date(),
                createdBy:        user.id,
                updatedBy:        user.id,
            },
        });

        await tx.rfqProduct.createMany({
            data: data.products.map((p) => ({
                rfqId:      createdRfq.id,
                productId:  p.productId,
                unitId:     p.unitId ?? undefined,
                quantity:   p.quantity,
                replyPrice: p.replyPrice ?? 0,
                notes:      p.notes ?? "",
                createdAt:  new Date(),
                updatedAt:  new Date(),
                createdBy:  user.id,
                updatedBy:  user.id,
            })),
        });

        return tx.rfq.findUnique({
            where:   { id: createdRfq.id },
            include: {
                rfqVendor:   true,
                rfqProducts: { include: { rfqProduct: true } },
            },
        });
    });

    return created(reply, { rfq }, "RFQ with products successfully created.");
};

export const createRfqController: TypedHandler<CreateRfqType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    // Validate vendor exists
    const existingVendor = await prisma.vendor.findFirst({
        where: { id: data.vendorId, deletedAt: null },
    });
    if (!existingVendor) {
        throw AppError.notFound("Vendor not found.");
    }

    // Unique RFQ number
    const existingNumber = await prisma.rfq.findFirst({
        where: { number: data.number },
    });
    if (existingNumber) {
        throw AppError.conflict("RFQ number already exists.");
    }

    // Unique reply number
    if (data.replyNumber) {
        const existingReplyNumber = await prisma.rfq.findFirst({
            where: { replyNumber: data.replyNumber },
        });
        if (existingReplyNumber) {
            throw AppError.conflict("Reply number already exists.");
        }
    }

    const rfq = await prisma.rfq.create({
        data: {
            vendorId:         data.vendorId,
            number:           data.number,
            title:            data.title,
            date:             data.date ? new Date(data.date) : new Date(),
            dueDate:          new Date(data.dueDate),
            status:           data.status,
            notes:            data.notes ?? undefined,
            replyNumber:      data.replyNumber ?? undefined,
            replyDate:        data.replyDate ? new Date(data.replyDate) : undefined,
            replyExpiredDate: data.replyExpiredDate ? new Date(data.replyExpiredDate) : undefined,
            replyNotes:       data.replyNotes ?? "",
            createdAt:        new Date(),
            updatedAt:        new Date(),
            createdBy:        user.id,
            updatedBy:        user.id,
        },
        include: {
            rfqVendor:   true,
            rfqProducts: true,
        },
    });

    return created(reply, { rfq }, "RFQ successfully created.");
};

export const updateRfqController: TypedHandler<UpdateRfqType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("RFQ id is required");
    }

    const existingRfq = await prisma.rfq.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingRfq) {
        throw AppError.notFound("RFQ not found.");
    }

    // Check reply number uniqueness if changed
    if (data.replyNumber && data.replyNumber !== existingRfq.replyNumber) {
        const duplicateReply = await prisma.rfq.findFirst({
            where: { replyNumber: data.replyNumber, id: { not: data.id } },
        });
        if (duplicateReply) {
            throw AppError.conflict("Reply number already exists.");
        }
    }

    const rfq = await prisma.rfq.update({
        where: { id: data.id },
        data: {
            ...(data.title            !== undefined && { title: data.title }),
            ...(data.date             !== undefined && { date: new Date(data.date) }),
            ...(data.dueDate          !== undefined && { dueDate: new Date(data.dueDate) }),
            ...(data.status           !== undefined && { status: data.status }),
            ...(data.notes            !== undefined && { notes: data.notes }),
            ...(data.replyNumber      !== undefined && { replyNumber: data.replyNumber }),
            ...(data.replyDate        !== undefined && { replyDate: new Date(data.replyDate) }),
            ...(data.replyExpiredDate !== undefined && { replyExpiredDate: new Date(data.replyExpiredDate) }),
            ...(data.replyNotes       !== undefined && { replyNotes: data.replyNotes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            rfqVendor:   true,
            rfqProducts: true,
        },
    });

    return success(reply, { rfq }, "RFQ successfully updated.");
};

export const deleteRfqController: TypedHandler<DeleteRfqType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("RFQ id is required");
    }

    const existingRfq = await prisma.rfq.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingRfq) {
        throw AppError.notFound("RFQ not found.");
    }

    const rfq = await prisma.rfq.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { rfq }, "RFQ successfully deleted.");
};

export const getRfqController: TypedHandler<GetRfqType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("RFQ id is required");
    }

    const rfq = await prisma.rfq.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            rfqVendor:     true,
            rfqProducts:   { include: { rfqProduct: true } },
            purchaseOrder: true,
        },
    });

    if (!rfq) {
        throw AppError.notFound("RFQ not found.");
    }

    return success(reply, { rfq }, "RFQ successfully fetched.");
};

export const getRfqsController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["number", "title", "notes", "replyNumber"]);

    const where = {
        deletedAt: null,
        ...searchFilter,
    };

    const [rfqs, total] = await Promise.all([
        prisma.rfq.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                rfqVendor:   true,
                rfqProducts: true,
            },
        }),
        prisma.rfq.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, rfqs, meta, "RFQs successfully fetched.");
};
