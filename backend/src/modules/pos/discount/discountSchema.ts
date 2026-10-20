import { z } from "zod";

export const createDiscountSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.number().positive(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  minOrderAmount: z.number().nonnegative().optional().nullable(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxUsageCount: z.number().int().positive().optional().nullable(),
});

export const updateDiscountSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).optional(),
  value: z.number().positive().optional(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  minOrderAmount: z.number().nonnegative().optional().nullable(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxUsageCount: z.number().int().positive().optional().nullable(),
});

export const deleteDiscountSchema = z.object({
  id: z.number().int().positive(),
});

export const validateDiscountSchema = z.object({
  code: z.string().min(1).max(50),
  orderSubtotal: z.number().nonnegative(),
});

export type CreateDiscountType = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountType = z.infer<typeof updateDiscountSchema>;
export type DeleteDiscountType = z.infer<typeof deleteDiscountSchema>;
export type ValidateDiscountType = z.infer<typeof validateDiscountSchema>;
