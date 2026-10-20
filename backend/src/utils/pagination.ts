import { z } from "zod";

export interface PaginationParams {
    page?: number | string;
    limit?: number | string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
    [key: string]: unknown;
}

export type PaginationQuery = PaginationParams;

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: PaginationMeta;
}

export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(1000).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    search: z.string().trim().optional()
}).passthrough();

export function buildPaginationQuery(
    params?: PaginationParams,
    options: {
        defaultLimit?: number;
        maxLimit?: number;
        defaultSortBy?: string;
        defaultSortOrder?: "asc" | "desc";
    } = {}
) {
    const defaultLimit = options.defaultLimit ?? 10;
    const maxLimit = options.maxLimit ?? 100;
    const defaultSortBy = options.defaultSortBy ?? "createdAt";
    const defaultSortOrder = options.defaultSortOrder ?? "desc";

    const rawPage = params?.page ? Number(params.page) : 1;
    const rawLimit = params?.limit ? Number(params.limit) : defaultLimit;

    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const limit = Math.min(maxLimit, Math.max(1, isNaN(rawLimit) ? defaultLimit : rawLimit));
    const skip = (page - 1) * limit;

    const sortBy = params?.sortBy || defaultSortBy;
    const sortOrder = (params?.sortOrder === "asc" || params?.sortOrder === "desc")
        ? params.sortOrder
        : defaultSortOrder;

    return {
        page,
        limit,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        } as Record<string, "asc" | "desc">
    };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit) || 1;
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };
}

export function buildSearchFilter(search?: string, fields: string[] = []): Record<string, any>[] | undefined {
    if (!search || !search.trim() || fields.length === 0) {
        return undefined;
    }

    const term = search.trim();
    return fields.map((field) => {
        // Support nested fields (e.g. "category.name")
        if (field.includes(".")) {
            const parts = field.split(".");
            let filterObj: any = { contains: term, mode: "insensitive" };
            for (let i = parts.length - 1; i >= 0; i--) {
                const part = parts[i]!;
                if (i === parts.length - 1) {
                    filterObj = { [part]: { contains: term, mode: "insensitive" } };
                } else {
                    filterObj = { [part]: filterObj };
                }
            }
            return filterObj;
        }

        return {
            [field]: {
                contains: term,
                mode: "insensitive"
            }
        };
    });
}
