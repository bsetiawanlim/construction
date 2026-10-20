import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta } from "../../../utils/pagination";
import {
  CreateScheduleType,
  UpdateScheduleType,
  DeleteScheduleType,
  GetSchedulesQueryType,
} from "./scheduleSchema";

const SCHEDULE_INCLUDE = {
  employee: {
    select: {
      id: true,
      profile: { select: { id: true, firstName: true, lastName: true, isCompany: true } },
      position: { select: { id: true, name: true } },
    },
  },
  facility: { select: { id: true, facilityName: true, facilityCode: true } },
} as const;

export async function createScheduleController(
  request: FastifyRequest<{ Body: CreateScheduleType }>,
  reply: FastifyReply
) {
  const data = request.body;
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const employee = await prisma.employee.findFirst({ where: { id: data.employeeId, deletedAt: null } });
  if (!employee) throw AppError.notFound("Employee not found.");

  // Prevent duplicate schedule for same employee on same date
  const existing = await prisma.employeeSchedule.findFirst({
    where: {
      employeeId: data.employeeId,
      scheduleDate: new Date(data.scheduleDate),
      deletedAt: null,
    },
  });
  if (existing) throw AppError.conflict("This employee already has a schedule for that date.");

  const schedule = await prisma.employeeSchedule.create({
    data: {
      employeeId: data.employeeId,
      scheduleDate: new Date(data.scheduleDate),
      startTime: data.startTime,
      endTime: data.endTime,
      facilityId: data.facilityId ?? null,
      notes: data.notes ?? null,
      createdBy: user.id,
      updatedBy: user.id,
    },
    include: SCHEDULE_INCLUDE,
  });

  return created(reply, schedule, "Schedule created.");
}

export async function updateScheduleController(
  request: FastifyRequest<{ Body: UpdateScheduleType }>,
  reply: FastifyReply
) {
  const data = request.body;
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const existing = await prisma.employeeSchedule.findFirst({ where: { id: data.id, deletedAt: null } });
  if (!existing) throw AppError.notFound("Schedule not found.");

  const updated = await prisma.employeeSchedule.update({
    where: { id: data.id },
    data: {
      scheduleDate: data.scheduleDate ? new Date(data.scheduleDate) : existing.scheduleDate,
      startTime: data.startTime ?? existing.startTime,
      endTime: data.endTime ?? existing.endTime,
      facilityId: data.facilityId !== undefined ? data.facilityId : existing.facilityId,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      updatedBy: user.id,
      updatedAt: new Date(),
    },
    include: SCHEDULE_INCLUDE,
  });

  return success(reply, updated, "Schedule updated.");
}

export async function deleteScheduleController(
  request: FastifyRequest<{ Body: DeleteScheduleType }>,
  reply: FastifyReply
) {
  const { id } = request.body;
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const existing = await prisma.employeeSchedule.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw AppError.notFound("Schedule not found.");

  await prisma.employeeSchedule.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: user.id },
  });

  return success(reply, { id }, "Schedule deleted.");
}

export async function getSchedulesController(
  request: FastifyRequest<{ Querystring: GetSchedulesQueryType }>,
  reply: FastifyReply
) {
  const params = request.query;
  const { skip, take, orderBy, page, limit } = buildPaginationQuery(params, {
    defaultSortBy: "scheduleDate",
    defaultSortOrder: "asc",
  });

  const where: any = { deletedAt: null, isActive: true };

  if (params.employeeId) {
    where.employeeId = Number(params.employeeId);
  }
  if (params.facilityId) {
    where.facilityId = Number(params.facilityId);
  }

  // Filter to a specific week (Monday → Sunday) when weekStart is provided
  if (params.weekStart) {
    const monday = new Date(params.weekStart);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    where.scheduleDate = { gte: monday, lte: sunday };
  }

  const [items, total] = await Promise.all([
    prisma.employeeSchedule.findMany({ where, skip, take, orderBy, include: SCHEDULE_INCLUDE }),
    prisma.employeeSchedule.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return paginated(reply, items, meta, "Schedules retrieved.", "schedules");
}
