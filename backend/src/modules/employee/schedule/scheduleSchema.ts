import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createScheduleSchema = z.object({
  employeeId: z.number().int().positive(),
  scheduleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(timeRegex, "Time must be HH:MM (24h)"),
  endTime: z.string().regex(timeRegex, "Time must be HH:MM (24h)"),
  facilityId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateScheduleSchema = z.object({
  id: z.number().int().positive(),
  scheduleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  facilityId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const deleteScheduleSchema = z.object({
  id: z.number().int().positive(),
});

export const getSchedulesQuerySchema = z.object({
  weekStart: z.string().optional(), // YYYY-MM-DD Monday of the desired week
  employeeId: z.string().optional(),
  facilityId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateScheduleType = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleType = z.infer<typeof updateScheduleSchema>;
export type DeleteScheduleType = z.infer<typeof deleteScheduleSchema>;
export type GetSchedulesQueryType = z.infer<typeof getSchedulesQuerySchema>;
