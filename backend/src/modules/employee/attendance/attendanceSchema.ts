import { z } from "zod";

export const attendanceStatusEnum = z.enum([
    "PRESENT",
    "LATE",
    "ABSENT",
    "SICK",
    "ON_LEAVE",
    "PERMISSION",
]);

export const createAttendanceSchema = z.object({
    employeeId: z.number().int().positive(),
    date: z.string(), // YYYY-MM-DD or ISO
    clockIn: z.string().nullish(),
    clockOut: z.string().nullish(),
    status: attendanceStatusEnum.default("PRESENT"),
    clockInIp: z.string().nullish(),
    clockOutIp: z.string().nullish(),
    clockInLocation: z.string().nullish(),
    clockOutLocation: z.string().nullish(),
    notes: z.string().nullish(),
});

export const updateAttendanceSchema = z.object({
    id: z.number().int().positive(),
    date: z.string().optional(),
    clockIn: z.string().nullish(),
    clockOut: z.string().nullish(),
    status: attendanceStatusEnum.optional(),
    clockInIp: z.string().nullish(),
    clockOutIp: z.string().nullish(),
    clockInLocation: z.string().nullish(),
    clockOutLocation: z.string().nullish(),
    notes: z.string().nullish(),
});

export const deleteAttendanceSchema = z.object({
    id: z.number().int().positive(),
});

export const getAttendanceSchema = z.object({
    id: z.number().int().positive(),
});

export const clockInSchema = z.object({
    employeeId: z.number().int().positive(),
    clockInLocation: z.string().nullish(),
    notes: z.string().nullish(),
});

export const clockOutSchema = z.object({
    employeeId: z.number().int().positive(),
    clockOutLocation: z.string().nullish(),
    notes: z.string().nullish(),
});

export type CreateAttendanceType = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceType = z.infer<typeof updateAttendanceSchema>;
export type DeleteAttendanceType = z.infer<typeof deleteAttendanceSchema>;
export type GetAttendanceType = z.infer<typeof getAttendanceSchema>;
export type ClockInType = z.infer<typeof clockInSchema>;
export type ClockOutType = z.infer<typeof clockOutSchema>;
