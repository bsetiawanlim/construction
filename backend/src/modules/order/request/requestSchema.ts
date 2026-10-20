import { z } from "zod";

export const requestOriginEnum = z.enum(["project", "office"]);
export const orderStatusEnum   = z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]);

// ── Request Source ───────────────────────────────────────────────────
export const createRequestSourceSchema = z.object({
    name:          z.string().min(1, "Name is required").max(50),
    requestOrigin: requestOriginEnum,
});

export const deleteRequestSourceSchema = z.object({
    id: z.number().int().positive("Request source id must be greater than 0"),
});

// ── Request ──────────────────────────────────────────────────────────
export const createRequestSchema = z.object({
    sourceId: z.number().int().positive("Source id must be greater than 0"),
    number:   z.string().min(1, "Request number is required"),
    title:    z.string().min(1, "Title is required"),
    date:     z.string().datetime().optional(),
    dueDate:  z.string().datetime(),
    status:   orderStatusEnum,
    notes:    z.string().optional().nullable(),
});

export const updateRequestSchema = z.object({
    id:       z.number().int().positive("Request id must be greater than 0"),
    sourceId: z.number().int().positive().optional(),
    title:    z.string().min(1).optional(),
    date:     z.string().datetime().optional(),
    dueDate:  z.string().datetime().optional(),
    status:   orderStatusEnum.optional(),
    notes:    z.string().optional().nullable(),
});

export const deleteRequestSchema = z.object({
    id: z.number().int().positive("Request id must be greater than 0"),
});

export const getRequestSchema = z.object({
    id: z.number().int().positive("Request id must be greater than 0"),
});

// ── Request Product ──────────────────────────────────────────────────
export const createRequestProductSchema = z.object({
    requestId: z.number().int().positive("Request id must be greater than 0"),
    productId: z.number().int().positive("Product id must be greater than 0"),
    unitId:    z.number().int().positive().optional().nullable(),
    quantity:  z.number().positive("Quantity must be greater than 0"),
    notes:     z.string().optional().nullable(),
});

export const updateRequestProductSchema = z.object({
    id:       z.number().int().positive("Request product id must be greater than 0"),
    unitId:   z.number().int().positive().optional().nullable(),
    quantity: z.number().positive().optional(),
    notes:    z.string().optional().nullable(),
});

export const deleteRequestProductSchema = z.object({
    id: z.number().int().positive("Request product id must be greater than 0"),
});

export const getRequestProductSchema = z.object({
    requestId: z.number().int().positive("Request id must be greater than 0"),
});

export type CreateRequestSourceType  = z.infer<typeof createRequestSourceSchema>;
export type DeleteRequestSourceType  = z.infer<typeof deleteRequestSourceSchema>;
export type CreateRequestType        = z.infer<typeof createRequestSchema>;
export type UpdateRequestType        = z.infer<typeof updateRequestSchema>;
export type DeleteRequestType        = z.infer<typeof deleteRequestSchema>;
export type GetRequestType           = z.infer<typeof getRequestSchema>;
export type CreateRequestProductType = z.infer<typeof createRequestProductSchema>;
export type UpdateRequestProductType = z.infer<typeof updateRequestProductSchema>;
export type DeleteRequestProductType = z.infer<typeof deleteRequestProductSchema>;
export type GetRequestProductType    = z.infer<typeof getRequestProductSchema>;
