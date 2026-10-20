import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta } from "../../../utils/pagination";
import {
  CreateDiscountType,
  UpdateDiscountType,
  DeleteDiscountType,
  ValidateDiscountType,
} from "./discountSchema";

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeDiscountAmount(
  discountType: string,
  value: number,
  subtotal: number,
  maxDiscountAmount?: number | null
): number {
  if (discountType === "PERCENTAGE") {
    const pct = Math.min(value, 100);
    const amount = (subtotal * pct) / 100;
    return maxDiscountAmount != null ? Math.min(amount, maxDiscountAmount) : amount;
  }
  // FIXED_AMOUNT — cannot exceed the subtotal
  return Math.min(value, subtotal);
}

// ── Controllers ───────────────────────────────────────────────────────────────

export async function listDiscountsController(
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string; search?: string; isActive?: string } }>,
  reply: FastifyReply
) {
  const params = request.query;
  const { skip, take, orderBy, page, limit } = buildPaginationQuery(params, {
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  const where: any = { deletedAt: null };

  if (params.search?.trim()) {
    const s = params.search.trim();
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { code: { contains: s, mode: "insensitive" } },
      { description: { contains: s, mode: "insensitive" } },
    ];
  }

  if (params.isActive !== undefined) {
    where.isActive = params.isActive === "true";
  }

  const [items, total] = await Promise.all([
    prisma.discount.findMany({ where, skip, take, orderBy }),
    prisma.discount.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return paginated(reply, items, meta, "Discounts retrieved.", "discounts");
}

export async function createDiscountController(
  request: FastifyRequest<{ Body: CreateDiscountType }>,
  reply: FastifyReply
) {
  const data = request.body;
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  // Ensure code is unique if provided
  if (data.code) {
    const existing = await prisma.discount.findFirst({
      where: { code: data.code, deletedAt: null },
    });
    if (existing) throw AppError.conflict(`Promo code "${data.code}" already exists.`);
  }

  const discount = await prisma.discount.create({
    data: {
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
      discountType: data.discountType as any,
      value: data.value,
      maxDiscountAmount: data.maxDiscountAmount ?? null,
      minOrderAmount: data.minOrderAmount ?? null,
      isActive: data.isActive ?? true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      maxUsageCount: data.maxUsageCount ?? null,
      createdBy: user.id,
      updatedBy: user.id,
    },
  });

  return created(reply, discount, "Discount created.");
}

export async function updateDiscountController(
  request: FastifyRequest<{ Body: UpdateDiscountType }>,
  reply: FastifyReply
) {
  const data = request.body;
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const existing = await prisma.discount.findFirst({ where: { id: data.id, deletedAt: null } });
  if (!existing) throw AppError.notFound("Discount not found.");

  if (data.code && data.code !== existing.code) {
    const dupe = await prisma.discount.findFirst({
      where: { code: data.code, deletedAt: null, id: { not: data.id } },
    });
    if (dupe) throw AppError.conflict(`Promo code "${data.code}" already in use.`);
  }

  const updated = await prisma.discount.update({
    where: { id: data.id },
    data: {
      name: data.name ?? existing.name,
      code: data.code !== undefined ? data.code : existing.code,
      description: data.description !== undefined ? data.description : existing.description,
      discountType: (data.discountType as any) ?? existing.discountType,
      value: data.value ?? existing.value,
      maxDiscountAmount: data.maxDiscountAmount !== undefined ? data.maxDiscountAmount : existing.maxDiscountAmount,
      minOrderAmount: data.minOrderAmount !== undefined ? data.minOrderAmount : existing.minOrderAmount,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      startsAt: data.startsAt !== undefined ? (data.startsAt ? new Date(data.startsAt) : null) : existing.startsAt,
      expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : existing.expiresAt,
      maxUsageCount: data.maxUsageCount !== undefined ? data.maxUsageCount : existing.maxUsageCount,
      updatedBy: user.id,
      updatedAt: new Date(),
    },
  });

  return success(reply, updated, "Discount updated.");
}

export async function deleteDiscountController(
  request: FastifyRequest<{ Body: DeleteDiscountType }>,
  reply: FastifyReply
) {
  const { id } = request.body;
  const user = request.session?.user;
  if (!user) throw AppError.unauthorized();

  const existing = await prisma.discount.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw AppError.notFound("Discount not found.");

  await prisma.discount.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: user.id },
  });

  return success(reply, { id }, "Discount deleted.");
}

export async function validateDiscountController(
  request: FastifyRequest<{ Body: ValidateDiscountType }>,
  reply: FastifyReply
) {
  const { code, orderSubtotal } = request.body;
  const now = new Date();

  const discount = await prisma.discount.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      isActive: true,
      deletedAt: null,
    },
  });

  if (!discount) {
    throw AppError.notFound("Promo code not found or inactive.");
  }

  // Validity period
  if (discount.startsAt && discount.startsAt > now) {
    throw AppError.badRequest("This promo has not started yet.");
  }
  if (discount.expiresAt && discount.expiresAt < now) {
    throw AppError.badRequest("This promo code has expired.");
  }

  // Usage limit
  if (discount.maxUsageCount != null && discount.usageCount >= discount.maxUsageCount) {
    throw AppError.badRequest("This promo code has reached its usage limit.");
  }

  // Minimum order
  const minOrder = discount.minOrderAmount ? Number(discount.minOrderAmount) : 0;
  if (orderSubtotal < minOrder) {
    throw AppError.badRequest(
      `Minimum order of ${minOrder.toLocaleString("id-ID", { style: "currency", currency: "IDR" })} required for this promo.`
    );
  }

  const discountAmount = computeDiscountAmount(
    discount.discountType,
    Number(discount.value),
    orderSubtotal,
    discount.maxDiscountAmount ? Number(discount.maxDiscountAmount) : null
  );

  return success(reply, {
    id: discount.id,
    name: discount.name,
    code: discount.code,
    discountType: discount.discountType,
    value: Number(discount.value),
    discountAmount,
    minOrderAmount: discount.minOrderAmount ? Number(discount.minOrderAmount) : null,
    maxDiscountAmount: discount.maxDiscountAmount ? Number(discount.maxDiscountAmount) : null,
    expiresAt: discount.expiresAt,
    usageCount: discount.usageCount,
    maxUsageCount: discount.maxUsageCount,
  }, "Promo code valid.");
}
