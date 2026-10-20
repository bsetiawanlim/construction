import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success } from "../../../utils/response";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateWorkItemType,
    UpdateWorkItemType,
    DeleteWorkItemType,
    GetWorkItemType,
    GetWorkItemsByWorkType,
} from "./workItemSchema";

export const createWorkItemController: TypedHandler<CreateWorkItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingWork = await prisma.work.findFirst({
        where: { id: data.workId, deletedAt: null },
    });
    if (!existingWork) {
        throw AppError.notFound("Work not found.");
    }

    const existingItem = await prisma.item.findFirst({
        where: { id: data.itemId, deletedAt: null },
    });
    if (!existingItem) {
        throw AppError.notFound("Item not found.");
    }

    const existingWorkItem = await prisma.workItem.findFirst({
        where: { workId: data.workId, itemId: data.itemId, deletedAt: null },
    });
    if (existingWorkItem) {
        throw AppError.conflict("WorkItem already exists for this work and item.");
    }

    const workItem = await prisma.workItem.create({
        data: {
            workId:     data.workId,
            itemId:     data.itemId,
            unitPrice:  data.unitPrice,
            amount:     data.amount,
            totalPrice: data.totalPrice,
            createdAt:  new Date(),
            updatedAt:  new Date(),
            createdBy:  user.id,
            updatedBy:  user.id,
        },
        include: {
            work: true,
            item: true,
        },
    });

    return created(reply, { workItem }, "WorkItem successfully created.");
};

export const updateWorkItemController: TypedHandler<UpdateWorkItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("WorkItem id is required");
    }

    const existingWorkItem = await prisma.workItem.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingWorkItem) {
        throw AppError.notFound("WorkItem not found.");
    }

    const workItem = await prisma.workItem.update({
        where: { id: data.id },
        data: {
            ...(data.unitPrice  !== undefined && { unitPrice: data.unitPrice }),
            ...(data.amount     !== undefined && { amount: data.amount }),
            ...(data.totalPrice !== undefined && { totalPrice: data.totalPrice }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            work: true,
            item: true,
        },
    });

    return success(reply, { workItem }, "WorkItem successfully updated.");
};

export const deleteWorkItemController: TypedHandler<DeleteWorkItemType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("WorkItem id is required");
    }

    const existingWorkItem = await prisma.workItem.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingWorkItem) {
        throw AppError.notFound("WorkItem not found.");
    }

    const workItem = await prisma.workItem.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { workItem }, "WorkItem successfully deleted.");
};

export const getWorkItemController: TypedHandler<GetWorkItemType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("WorkItem id is required");
    }

    const workItem = await prisma.workItem.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            work: true,
            item: true,
        },
    });
    if (!workItem) {
        throw AppError.notFound("WorkItem not found.");
    }

    return success(reply, { workItem }, "WorkItem successfully fetched.");
};

export const getWorkItemsByWorkController: TypedHandler<GetWorkItemsByWorkType> = async (request, reply) => {
    const data = request.body;

    if (!data?.workId) {
        throw AppError.badRequest("workId is required");
    }

    const workItems = await prisma.workItem.findMany({
        where: { workId: data.workId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
            item: true,
        },
    });

    return success(reply, { workItems }, "WorkItems successfully fetched.");
};
