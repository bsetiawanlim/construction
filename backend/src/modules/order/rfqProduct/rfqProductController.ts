import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success } from "../../../utils/response";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateRfqProductType,
    UpdateRfqProductType,
    DeleteRfqProductType,
    GetRfqProductType,
} from "./rfqProductSchema";

export const createRfqProductController: TypedHandler<CreateRfqProductType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingRfq = await prisma.rfq.findFirst({
        where: { id: data.rfqId, deletedAt: null },
    });
    if (!existingRfq) {
        throw AppError.notFound("RFQ not found.");
    }

    const existingProduct = await prisma.product.findFirst({
        where: { id: data.productId, deletedAt: null },
    });
    if (!existingProduct) {
        throw AppError.notFound("Product not found.");
    }

    const duplicate = await prisma.rfqProduct.findFirst({
        where: { rfqId: data.rfqId, productId: data.productId, deletedAt: null },
    });
    if (duplicate) {
        throw AppError.conflict("Product already added to this RFQ.");
    }

    const rfqProduct = await prisma.rfqProduct.create({
        data: {
            rfqId:      data.rfqId,
            productId:  data.productId,
            unitId:     data.unitId ?? undefined,
            quantity:   data.quantity,
            replyPrice: data.replyPrice ?? 0,
            notes:      data.notes ?? undefined,
            createdAt:  new Date(),
            updatedAt:  new Date(),
            createdBy:  user.id,
            updatedBy:  user.id,
        },
        include: { rfqProduct: true },
    });

    return created(reply, { rfqProduct }, "RFQ product successfully added.");
};

export const updateRfqProductController: TypedHandler<UpdateRfqProductType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("RFQ product id is required");
    }

    const existing = await prisma.rfqProduct.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("RFQ product not found.");
    }

    const rfqProduct = await prisma.rfqProduct.update({
        where: { id: data.id },
        data: {
            ...(data.unitId     !== undefined && { unitId: data.unitId }),
            ...(data.quantity   !== undefined && { quantity: data.quantity }),
            ...(data.replyPrice !== undefined && { replyPrice: data.replyPrice }),
            ...(data.notes      !== undefined && { notes: data.notes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { rfqProduct: true },
    });

    return success(reply, { rfqProduct }, "RFQ product successfully updated.");
};

export const deleteRfqProductController: TypedHandler<DeleteRfqProductType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("RFQ product id is required");
    }

    const existing = await prisma.rfqProduct.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("RFQ product not found.");
    }

    const rfqProduct = await prisma.rfqProduct.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { rfqProduct }, "RFQ product successfully removed.");
};

export const getRfqProductsByRfqController: TypedHandler<GetRfqProductType> = async (request, reply) => {
    const data = request.body;

    if (!data?.rfqId) {
        throw AppError.badRequest("rfqId is required");
    }

    const rfqProducts = await prisma.rfqProduct.findMany({
        where: { rfqId: data.rfqId, deletedAt: null },
        include: { rfqProduct: true },
        orderBy: { createdAt: "asc" },
    });

    return success(reply, { rfqProducts }, "RFQ products successfully fetched.");
};
