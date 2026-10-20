import { z } from "zod";

export const wasteReasonEnum = z.enum([
  "EXPIRED",
  "SPOILED",
  "LOST",
  "DAMAGED",
  "SCRAP",
  "OTHER",
]);

export const createProductWasteSchema = z.object({
  productId: z.number().int().positive("Product ID must be greater than 0"),
  facilityId: z.number().int().positive().optional().nullable(),
  sectionId: z.number().int().positive().optional().nullable(),
  quantity: z.number().positive("Quantity written off must be greater than 0"),
  reason: wasteReasonEnum,
  unitCost: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  wasteDate: z.string().datetime().optional().nullable(),
});

export const getProductWasteSchema = z.object({
  productId: z.coerce.number().int().positive().optional().nullable(),
  facilityId: z.coerce.number().int().positive().optional().nullable(),
  reason: wasteReasonEnum.optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
});

export type CreateProductWasteType = z.infer<typeof createProductWasteSchema>;
export type GetProductWasteType = z.infer<typeof getProductWasteSchema>;
export type WasteReasonType = z.infer<typeof wasteReasonEnum>;
