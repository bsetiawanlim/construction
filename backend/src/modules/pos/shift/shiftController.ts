import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta } from "../../../utils/pagination";
import { OpenShiftType, CloseShiftType, GetShiftsQueryType } from "./shiftSchema";

const SHIFT_INCLUDE = {
  openedByUser: { select: { id: true, name: true, email: true } },
  closedByUser: { select: { id: true, name: true, email: true } },
  facility: { select: { id: true, facilityName: true, facilityCode: true } },
} as const;

export async function openShiftController(
  request: FastifyRequest<{ Body: OpenShiftType }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  // Only one open shift allowed per facility (or globally if no facility)
  const existing = await prisma.shift.findFirst({
    where: {
      openedBy: user.id,
      closedAt: null,
    },
  });
  if (existing) {
    throw AppError.conflict("You already have an open shift. Close it before starting a new one.");
  }

  const shift = await prisma.shift.create({
    data: {
      openedBy: user.id,
      openingCash: request.body.openingCash,
      facilityId: request.body.facilityId ?? null,
      notes: request.body.notes ?? null,
    },
    include: SHIFT_INCLUDE,
  });

  return created(reply, shift, "Shift opened successfully.");
}

export async function closeShiftController(
  request: FastifyRequest<{ Body: CloseShiftType }>,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const openShift = await prisma.shift.findFirst({
    where: { openedBy: user.id, closedAt: null },
  });
  if (!openShift) {
    throw AppError.notFound("No open shift found for this user.");
  }

  const closedAt = new Date();

  // Aggregate sales completed during this shift window
  const salesAgg = await prisma.salesPayment.groupBy({
    by: ["method"],
    where: {
      createdAt: { gte: openShift.openedAt, lte: closedAt },
      status: "SETTLED",
      deletedAt: null,
      salesOrder: { status: "COMPLETED", deletedAt: null },
    },
    _sum: { amount: true },
  });

  const orderCount = await prisma.salesOrder.count({
    where: {
      createdAt: { gte: openShift.openedAt, lte: closedAt },
      status: "COMPLETED",
      deletedAt: null,
    },
  });

  let totalCash = 0, totalCard = 0, totalTransfer = 0, totalEwallet = 0;
  for (const row of salesAgg) {
    const amt = Number(row._sum.amount ?? 0);
    if (row.method === "CASH") totalCash = amt;
    else if (row.method === "CARD") totalCard = amt;
    else if (row.method === "BANK_TRANSFER") totalTransfer = amt;
    else if (row.method === "EWALLET") totalEwallet = amt;
  }

  const totalSales = totalCash + totalCard + totalTransfer + totalEwallet;
  const expectedCash = Number(openShift.openingCash) + totalCash;
  const closingCash = request.body.closingCash;
  const cashVariance = closingCash - expectedCash;

  const closed = await prisma.shift.update({
    where: { id: openShift.id },
    data: {
      closedBy: user.id,
      closedAt,
      closingCash,
      expectedCash,
      cashVariance,
      totalSales,
      totalOrders: orderCount,
      totalCash,
      totalCard,
      totalTransfer,
      totalEwallet,
      notes: request.body.notes ?? openShift.notes,
      updatedAt: new Date(),
    },
    include: SHIFT_INCLUDE,
  });

  return success(reply, closed, "Shift closed successfully.");
}

export async function getCurrentShiftController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const shift = await prisma.shift.findFirst({
    where: { openedBy: user.id, closedAt: null },
    include: SHIFT_INCLUDE,
  });

  return success(reply, shift ?? null, shift ? "Active shift found." : "No active shift.");
}

export async function listShiftsController(
  request: FastifyRequest<{ Querystring: GetShiftsQueryType }>,
  reply: FastifyReply
) {
  const params = request.query;
  const { skip, take, orderBy, page, limit } = buildPaginationQuery(params, {
    defaultSortBy: "openedAt",
    defaultSortOrder: "desc",
  });

  const where: any = {};

  if (params.facilityId) {
    where.facilityId = Number(params.facilityId);
  }
  if (params.openOnly === "true") {
    where.closedAt = null;
  }
  if (params.startDate || params.endDate) {
    where.openedAt = {};
    if (params.startDate) where.openedAt.gte = new Date(params.startDate);
    if (params.endDate) where.openedAt.lte = new Date(params.endDate);
  }

  const [items, total] = await Promise.all([
    prisma.shift.findMany({ where, skip, take, orderBy, include: SHIFT_INCLUDE }),
    prisma.shift.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return paginated(reply, items, meta, "Shifts retrieved.", "shifts");
}
