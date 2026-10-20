import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreateTaskType,
    UpdateTaskType,
    DeleteTaskType,
    GetTaskType,
    GetTasksQueryType,
} from "./taskSchema";

export const createTaskController: TypedHandler<CreateTaskType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    if (data.workId) {
        const existingWork = await prisma.work.findFirst({
            where: { id: data.workId, deletedAt: null },
        });
        if (!existingWork) {
            throw AppError.notFound("Associated work not found.");
        }
    }

    if (data.assigneeId) {
        const existingAssignee = await prisma.user.findFirst({
            where: { id: data.assigneeId },
        });
        if (!existingAssignee) {
            throw AppError.notFound("Assignee user not found.");
        }
    }

    const task = await prisma.task.create({
        data: {
            title:       data.title,
            description: data.description ?? undefined,
            status:      data.status ?? "TODO",
            priority:    data.priority ?? "MEDIUM",
            dueDate:     data.dueDate ? new Date(data.dueDate) : undefined,
            workId:      data.workId ?? undefined,
            assigneeId:  data.assigneeId ?? undefined,
            createdAt:   new Date(),
            updatedAt:   new Date(),
            createdBy:   user.id,
            updatedBy:   user.id,
        },
        include: {
            taskWork:     true,
            taskAssignee: { select: { id: true, name: true, email: true } },
        },
    });

    return created(reply, { task }, "Task successfully created.");
};

export const updateTaskController: TypedHandler<UpdateTaskType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Task id is required");
    }

    const existingTask = await prisma.task.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingTask) {
        throw AppError.notFound("Task not found.");
    }

    if (data.workId) {
        const existingWork = await prisma.work.findFirst({
            where: { id: data.workId, deletedAt: null },
        });
        if (!existingWork) {
            throw AppError.notFound("Associated work not found.");
        }
    }

    if (data.assigneeId) {
        const existingAssignee = await prisma.user.findFirst({
            where: { id: data.assigneeId },
        });
        if (!existingAssignee) {
            throw AppError.notFound("Assignee user not found.");
        }
    }

    const task = await prisma.task.update({
        where: { id: data.id },
        data: {
            ...(data.title       !== undefined && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.status      !== undefined && { status: data.status }),
            ...(data.priority    !== undefined && { priority: data.priority }),
            ...(data.dueDate     !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
            ...(data.workId      !== undefined && { workId: data.workId }),
            ...(data.assigneeId  !== undefined && { assigneeId: data.assigneeId }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: {
            taskWork:     true,
            taskAssignee: { select: { id: true, name: true, email: true } },
        },
    });

    return success(reply, { task }, "Task successfully updated.");
};

export const deleteTaskController: TypedHandler<DeleteTaskType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Task id is required");
    }

    const existingTask = await prisma.task.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingTask) {
        throw AppError.notFound("Task not found.");
    }

    const task = await prisma.task.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { task }, "Task successfully deleted.");
};

export const getTaskController: TypedHandler<GetTaskType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Task id is required");
    }

    const task = await prisma.task.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            taskWork:     true,
            taskAssignee: { select: { id: true, name: true, email: true } },
        },
    });
    if (!task) {
        throw AppError.notFound("Task not found.");
    }

    return success(reply, { task }, "Task successfully fetched.");
};

export const getTasksController: TypedHandler<unknown, unknown, GetTasksQueryType> = async (request, reply) => {
    const query = request.query;
    const { page, limit, skip, orderBy } = buildPaginationQuery(query);
    const searchFilter = buildSearchFilter(query?.search, ["title", "description"]);

    const where = {
        deletedAt: null,
        ...(query?.status     ? { status: query.status } : {}),
        ...(query?.priority   ? { priority: query.priority } : {}),
        ...(query?.workId     ? { workId: query.workId } : {}),
        ...(query?.assigneeId ? { assigneeId: query.assigneeId } : {}),
        ...(searchFilter ? { OR: searchFilter } : {}),
    };

    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                taskWork:     { select: { id: true, name: true } },
                taskAssignee: { select: { id: true, name: true, email: true } },
            },
        }),
        prisma.task.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, tasks, meta, "Tasks successfully fetched.");
};
