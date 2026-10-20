import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateWorkOfferItemType,
    UpdateWorkOfferItemType,
    DeleteWorkOfferItemType,
    GetWorkOfferItemType,
    GetWorkOfferItemsByOfferType,
} from "./workOfferItemSchema";

export const createWorkOfferItemController: TypedHandler<CreateWorkOfferItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingWorkOffer = await prisma.workOffer.findFirst({
        where: { id: data.workOfferId, deletedAt: null },
    });
    if (!existingWorkOffer) {
        throw AppError.notFound("WorkOffer not found.");
    }

    const existingWork = await prisma.work.findFirst({
        where: { id: data.workId, deletedAt: null },
    });
    if (!existingWork) {
        throw AppError.notFound("Work not found.");
    }

    const duplicate = await prisma.workOfferItem.findFirst({
        where: { workOfferId: data.workOfferId, workId: data.workId, deletedAt: null },
    });
    if (duplicate) {
        throw AppError.conflict("Work is already added to this work offer.");
    }

    const workOfferItem = await prisma.workOfferItem.create({
        data: {
            workOfferId: data.workOfferId,
            workId:      data.workId,
            unitPrice:   data.unitPrice,
            amount:      data.amount,
            totalPrice:  data.totalPrice,
            createdAt:   new Date(),
            updatedAt:   new Date(),
            createdBy:   user.id,
            updatedBy:   user.id,
        },
        include: {
            workOffer: true,
            work:      true,
        },
    });

    return created(reply, { workOfferItem }, "WorkOfferItem successfully created.");
};

export const updateWorkOfferItemController: TypedHandler<UpdateWorkOfferItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("WorkOfferItem id is required");
    }

    const existingWorkOfferItem = await prisma.workOfferItem.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingWorkOfferItem) {
        throw AppError.notFound("WorkOfferItem not found.");
    }

    const workOfferItem = await prisma.workOfferItem.update({
        where: { id: data.id },
        data: {
            ...(data.unitPrice  !== undefined && { unitPrice: data.unitPrice }),
            ...(data.amount     !== undefined && { amount: data.amount }),
            ...(data.totalPrice !== undefined && { totalPrice: data.totalPrice }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            workOffer: true,
            work:      true,
        },
    });

    return success(reply, { workOfferItem }, "WorkOfferItem successfully updated.");
};

export const deleteWorkOfferItemController: TypedHandler<DeleteWorkOfferItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("WorkOfferItem id is required");
    }

    const existingWorkOfferItem = await prisma.workOfferItem.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingWorkOfferItem) {
        throw AppError.notFound("WorkOfferItem not found.");
    }

    const workOfferItem = await prisma.workOfferItem.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { workOfferItem }, "WorkOfferItem successfully deleted.");
};

export const getWorkOfferItemController: TypedHandler<GetWorkOfferItemType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("WorkOfferItem id is required");
    }

    const workOfferItem = await prisma.workOfferItem.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            workOffer: true,
            work:      true,
        },
    });
    if (!workOfferItem) {
        throw AppError.notFound("WorkOfferItem not found.");
    }

    return success(reply, { workOfferItem }, "WorkOfferItem successfully fetched.");
};

export const getWorkOfferItemsByOfferController: TypedHandler<GetWorkOfferItemsByOfferType> = async (request, reply) => {
    const data = request.body;

    if (!data?.workOfferId) {
        throw AppError.badRequest("workOfferId is required");
    }

    const workOfferItems = await prisma.workOfferItem.findMany({
        where:   { workOfferId: data.workOfferId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { work: true },
    });

    return success(reply, { workOfferItems }, "WorkOfferItems successfully fetched.");
};

export const getAllWorkOfferItemsController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);

    const where = {
        deletedAt: null,
    };

    const [workOfferItems, total] = await Promise.all([
        prisma.workOfferItem.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                workOffer: true,
                work:      true,
            },
        }),
        prisma.workOfferItem.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, workOfferItems, meta, "WorkOfferItems successfully fetched.");
};
