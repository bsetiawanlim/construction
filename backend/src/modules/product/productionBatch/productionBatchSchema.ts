import { z } from "zod";

export const createProductionBatchSchema = z.object({
  productId: z.number({ message: "Product ID is required" }),
  quantity: z.number().positive("Batch quantity must be greater than zero"),
  facilityId: z.number().int().positive("Facility is required"),
  personInChargeId: z.number().int().positive("Person in charge (employee) is required"),
  notes: z.string().optional().nullable(),
});

export const confirmProductionBatchSchema = z.object({
  id: z.number({ message: "Batch ID is required" }),
  notes: z.string().optional().nullable(),
});

export const cancelProductionBatchSchema = z.object({
  id: z.number({ message: "Batch ID is required" }),
  reason: z.string().optional().nullable(),
});

export const getProductionBatchQuerySchema = z.object({
  productId: z.coerce.number().optional(),
  facilityId: z.coerce.number().optional(),
  personInChargeId: z.coerce.number().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1).optional(),
  limit: z.coerce.number().default(50).optional(),
});

export const previewProductionBatchSchema = z.object({
  productId: z.number({ message: "Product ID is required" }),
  quantity: z.number().positive("Quantity must be greater than zero"),
  facilityId: z.number().int().positive().optional().nullable(),
});

export type CreateProductionBatchType = z.infer<typeof createProductionBatchSchema>;
export type ConfirmProductionBatchType = z.infer<typeof confirmProductionBatchSchema>;
export type CancelProductionBatchType = z.infer<typeof cancelProductionBatchSchema>;
export type GetProductionBatchQueryType = z.infer<typeof getProductionBatchQuerySchema>;
export type PreviewProductionBatchType = z.infer<typeof previewProductionBatchSchema>;
