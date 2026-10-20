import { z } from "zod";

export const taskStatusEnum = z.enum([
    "TODO",
    "IN_PROGRESS",
    "REVIEW",
    "DONE",
    "CANCELLED",
]);

export const taskPriorityEnum = z.enum([
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
]);

// ── Create ────────────────────────────────────────────────────────────
export const createTaskSchema = z.object({
    title:       z.string().min(1, "Title is required").max(150),
    description: z.string().optional().nullable(),
    status:      taskStatusEnum.default("TODO").optional(),
    priority:    taskPriorityEnum.default("MEDIUM").optional(),
    dueDate:     z.string().datetime().optional().nullable(),
    workId:      z.number().int().positive().optional().nullable(),
    assigneeId:  z.string().optional().nullable(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateTaskSchema = z.object({
    id:          z.number().int().positive("Task id must be greater than 0"),
    title:       z.string().min(1).max(150).optional(),
    description: z.string().optional().nullable(),
    status:      taskStatusEnum.optional(),
    priority:    taskPriorityEnum.optional(),
    dueDate:     z.string().datetime().optional().nullable(),
    workId:      z.number().int().positive().optional().nullable(),
    assigneeId:  z.string().optional().nullable(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteTaskSchema = z.object({
    id: z.number().int().positive("Task id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getTaskSchema = z.object({
    id: z.number().int().positive("Task id must be greater than 0"),
});

// ── Query ─────────────────────────────────────────────────────────────
export const getTasksQuerySchema = z.object({
    page:       z.coerce.number().int().min(1).default(1).optional(),
    limit:      z.coerce.number().int().min(1).max(100).default(10).optional(),
    sortBy:     z.string().optional(),
    sortOrder:  z.enum(["asc", "desc"]).default("desc").optional(),
    search:     z.string().trim().optional(),
    status:     taskStatusEnum.optional(),
    priority:   taskPriorityEnum.optional(),
    workId:     z.coerce.number().int().positive().optional(),
    assigneeId: z.string().optional(),
});

export type CreateTaskType    = z.infer<typeof createTaskSchema>;
export type UpdateTaskType    = z.infer<typeof updateTaskSchema>;
export type DeleteTaskType    = z.infer<typeof deleteTaskSchema>;
export type GetTaskType       = z.infer<typeof getTaskSchema>;
export type GetTasksQueryType = z.infer<typeof getTasksQuerySchema>;
