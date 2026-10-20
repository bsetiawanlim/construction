import { FastifyReply } from "fastify";
import { PaginationMeta } from "./pagination";

export interface ApiResponse<T = unknown> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    [key: string]: unknown;
}

export function success<T>(
    reply: FastifyReply,
    data?: T,
    message = "Request completed successfully.",
    statusCode = 200,
    extraFields: Record<string, unknown> = {}
) {
    const payload: ApiResponse<T> = {
        success: true,
        statusCode,
        message,
        ...(data !== undefined ? { data } : {}),
        ...extraFields
    };
    return reply.status(statusCode).send(payload);
}

export function created<T>(
    reply: FastifyReply,
    data?: T,
    message = "Resource successfully created.",
    extraFields: Record<string, unknown> = {}
) {
    return success(reply, data, message, 201, extraFields);
}

export function noContent(reply: FastifyReply) {
    return reply.status(204).send();
}

export function paginated<T>(
    reply: FastifyReply,
    items: T[],
    pagination: PaginationMeta,
    message = "Data successfully fetched.",
    entityKey?: string
) {
    const extra: Record<string, unknown> = {
        pagination
    };

    if (entityKey) {
        extra[entityKey] = items;
    }

    return success(reply, items, message, 200, extra);
}
