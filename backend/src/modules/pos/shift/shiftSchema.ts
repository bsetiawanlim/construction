import { z } from "zod";

export const openShiftSchema = z.object({
  openingCash: z.number().nonnegative(),
  facilityId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const closeShiftSchema = z.object({
  closingCash: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
});

export const getShiftsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  facilityId: z.string().optional(),
  openOnly: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type OpenShiftType = z.infer<typeof openShiftSchema>;
export type CloseShiftType = z.infer<typeof closeShiftSchema>;
export type GetShiftsQueryType = z.infer<typeof getShiftsQuerySchema>;
