import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, PaginationParams } from "../../../utils/pagination";
import {
    CreateAttendanceType,
    UpdateAttendanceType,
    DeleteAttendanceType,
    GetAttendanceType,
    ClockInType,
    ClockOutType,
} from "./attendanceSchema";

function calculateDurationMinutes(start: Date | null, end: Date | null): number | null {
    if (!start || !end) return null;
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60)));
}

function normalizeDate(d: string | Date): Date {
    const dateObj = new Date(d);
    return new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
}

export async function createAttendanceController(
    request: FastifyRequest<{ Body: CreateAttendanceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) throw AppError.unauthorized();

    const dateVal = normalizeDate(data.date);
    const clockInVal = data.clockIn ? new Date(data.clockIn) : null;
    const clockOutVal = data.clockOut ? new Date(data.clockOut) : null;
    const duration = calculateDurationMinutes(clockInVal, clockOutVal);

    // Check if there is an active incomplete session (clocked in without clocking out)
    if (clockInVal && !clockOutVal) {
        const activeSession = await prisma.attendance.findFirst({
            where: {
                employeeId: data.employeeId,
                date: dateVal,
                clockIn: { not: null },
                clockOut: null,
                deletedAt: null,
            },
        });
        if (activeSession) {
            throw AppError.conflict("Employee already has an active open attendance session for this date. Please clock out the current session before starting a new one.");
        }
    }

    const clientIp = request.ip || null;

    const record = await prisma.attendance.create({
        data: {
            employeeId: data.employeeId,
            date: dateVal,
            clockIn: clockInVal,
            clockOut: clockOutVal,
            status: data.status,
            clockInIp: data.clockInIp || clientIp,
            clockOutIp: data.clockOutIp || null,
            clockInLocation: data.clockInLocation || null,
            clockOutLocation: data.clockOutLocation || null,
            workDurationMinutes: duration,
            notes: data.notes || null,
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: {
            employee: {
                include: {
                    profile: true,
                    position: true,
                },
            },
        },
    });

    return created(reply, record, "Attendance record created successfully.");
}

export async function updateAttendanceController(
    request: FastifyRequest<{ Body: UpdateAttendanceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) throw AppError.unauthorized();

    const existing = await prisma.attendance.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound("Attendance record not found.");

    const clockInVal = data.clockIn !== undefined ? (data.clockIn ? new Date(data.clockIn) : null) : existing.clockIn;
    const clockOutVal = data.clockOut !== undefined ? (data.clockOut ? new Date(data.clockOut) : null) : existing.clockOut;
    const duration = calculateDurationMinutes(clockInVal, clockOutVal);

    const updateData: any = {
        updatedAt: new Date(),
        updatedBy: user.id,
        workDurationMinutes: duration,
    };

    if (data.date !== undefined) updateData.date = normalizeDate(data.date);
    if (data.clockIn !== undefined) updateData.clockIn = clockInVal;
    if (data.clockOut !== undefined) updateData.clockOut = clockOutVal;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.clockInIp !== undefined) updateData.clockInIp = data.clockInIp;
    if (data.clockOutIp !== undefined) updateData.clockOutIp = data.clockOutIp;
    if (data.clockInLocation !== undefined) updateData.clockInLocation = data.clockInLocation;
    if (data.clockOutLocation !== undefined) updateData.clockOutLocation = data.clockOutLocation;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const record = await prisma.attendance.update({
        where: { id: data.id },
        data: updateData,
        include: {
            employee: {
                include: {
                    profile: true,
                    position: true,
                },
            },
        },
    });

    return success(reply, record, "Attendance record updated successfully.");
}

export async function deleteAttendanceController(
    request: FastifyRequest<{ Body: DeleteAttendanceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) throw AppError.unauthorized();

    const existing = await prisma.attendance.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) throw AppError.notFound("Attendance record not found.");

    await prisma.attendance.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, null, "Attendance record deleted successfully.");
}

export async function getAttendanceController(
    request: FastifyRequest<{ Body: GetAttendanceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const record = await prisma.attendance.findFirst({
        where: { id: data.id, deletedAt: null },
        include: {
            employee: {
                include: {
                    profile: true,
                    position: true,
                },
            },
        },
    });
    if (!record) throw AppError.notFound("Attendance record not found.");

    return success(reply, record, "Attendance record fetched successfully.");
}

export async function clockInController(
    request: FastifyRequest<{ Body: ClockInType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) throw AppError.unauthorized();

    const now = new Date();
    const today = normalizeDate(now);
    const clientIp = request.ip || null;

    // Check if there is an active open session (clocked in without clockOut)
    const activeSession = await prisma.attendance.findFirst({
        where: {
            employeeId: data.employeeId,
            date: today,
            clockIn: { not: null },
            clockOut: null,
            deletedAt: null,
        },
    });

    if (activeSession) {
        throw AppError.conflict("Employee has already clocked in and is currently on an active session. Please clock out first before starting another session.");
    }

    const record = await prisma.attendance.create({
        data: {
            employeeId: data.employeeId,
            date: today,
            clockIn: now,
            status: "PRESENT",
            clockInIp: clientIp,
            clockInLocation: data.clockInLocation || null,
            notes: data.notes || null,
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: {
            employee: {
                include: {
                    profile: true,
                    position: true,
                },
            },
        },
    });

    return created(reply, record, "Clock-in recorded successfully.");
}

export async function clockOutController(
    request: FastifyRequest<{ Body: ClockOutType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) throw AppError.unauthorized();

    const now = new Date();
    const today = normalizeDate(now);
    const clientIp = request.ip || null;

    // Find the latest active session for today that has not clocked out
    const activeSession = await prisma.attendance.findFirst({
        where: {
            employeeId: data.employeeId,
            date: today,
            clockIn: { not: null },
            clockOut: null,
            deletedAt: null,
        },
        orderBy: {
            id: "desc",
        },
    });

    if (!activeSession) {
        throw AppError.notFound("No active open attendance session found for today. Please clock in first.");
    }

    const duration = calculateDurationMinutes(activeSession.clockIn, now);

    const updated = await prisma.attendance.update({
        where: { id: activeSession.id },
        data: {
            clockOut: now,
            clockOutIp: clientIp,
            clockOutLocation: data.clockOutLocation || activeSession.clockOutLocation,
            workDurationMinutes: duration,
            notes: data.notes ? (activeSession.notes ? activeSession.notes + " | " + data.notes : data.notes) : activeSession.notes,
            updatedBy: user.id,
            updatedAt: now,
        },
        include: {
            employee: {
                include: {
                    profile: true,
                    position: true,
                },
            },
        },
    });

    return success(reply, updated, "Clock-out recorded successfully.");
}

export async function getAttendancesController(
    request: FastifyRequest<{ Querystring: PaginationParams & { employeeId?: number; date?: string; status?: string } }>,
    reply: FastifyReply
) {
    const query = request.query || {};
    const { page, limit, skip, orderBy } = buildPaginationQuery(query, {
        defaultSortBy: "date",
        defaultSortOrder: "desc",
    });

    const where: any = {
        deletedAt: null,
    };

    if (query.employeeId) {
        where.employeeId = Number(query.employeeId);
    }
    if (query.date) {
        where.date = normalizeDate(query.date);
    }
    if (query.status) {
        where.status = query.status;
    }

    const [attendances, total] = await Promise.all([
        prisma.attendance.findMany({
            where,
            skip,
            take: limit,
            orderBy: { date: "desc" },
            include: {
                employee: {
                    include: {
                        profile: true,
                        position: true,
                    },
                },
            },
        }),
        prisma.attendance.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, attendances, meta, "Attendance records fetched successfully.", "attendances");
}
