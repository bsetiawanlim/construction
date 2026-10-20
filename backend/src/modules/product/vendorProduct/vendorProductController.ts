import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta } from "../../../utils/pagination";
import {
  CreateVendorProductType,
  UpdateVendorProductType,
  DeleteVendorProductType,
  BatchLinkVendorProductsType,
  BatchLinkProductVendorsType,
  GetVendorProductsQueryType,
} from "./vendorProductSchema";

export async function createVendorProductController(
  request: FastifyRequest<{ Body: CreateVendorProductType }>,
  reply: FastifyReply
) {
  const data = request.body;
  const user = request.session?.user;
  if (!user) {
    throw AppError.unauthorized();
  }

  const vendor = await prisma.vendor.findFirst({
    where: { id: data.vendorId, deletedAt: null },
    include: { profile: true },
  });
  if (!vendor) {
    throw AppError.notFound("Vendor not found.");
  }

  const product = await prisma.product.findFirst({
    where: { id: data.productId, deletedAt: null },
  });
  if (!product) {
    throw AppError.notFound("Product not found.");
  }

  const existing = await prisma.vendorProduct.findFirst({
    where: {
      vendorId: data.vendorId,
      productId: data.productId,
    },
  });

  if (existing) {
    if (!existing.deletedAt) {
      throw AppError.conflict("This product is already linked to this vendor.");
    }

    // Restore previously soft-deleted link
    const restored = await prisma.vendorProduct.update({
      where: { id: existing.id },
      data: {
        vendorSku: data.vendorSku ?? existing.vendorSku,
        vendorPrice: data.vendorPrice !== undefined && data.vendorPrice !== null ? data.vendorPrice : existing.vendorPrice,
        currency: data.currency || existing.currency,
        leadTimeDays: data.leadTimeDays !== undefined ? data.leadTimeDays : existing.leadTimeDays,
        minOrderQuantity: data.minOrderQuantity !== undefined ? data.minOrderQuantity : existing.minOrderQuantity,
        isPreferred: data.isPreferred !== undefined ? data.isPreferred : existing.isPreferred,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        deletedAt: null,
        updatedAt: new Date(),
        updatedBy: user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            productName: true,
            sku: true,
            barcode: true,
            currentStock: true,
            unitLabel: true,
          },
        },
        vendor: {
          include: { profile: true },
        },
      },
    });

    return success(reply, restored, "Product vendor link restored.");
  }

  const newLink = await prisma.vendorProduct.create({
    data: {
      vendorId: data.vendorId,
      productId: data.productId,
      vendorSku: data.vendorSku || null,
      vendorPrice: data.vendorPrice ?? null,
      currency: data.currency || "IDR",
      leadTimeDays: data.leadTimeDays ?? null,
      minOrderQuantity: data.minOrderQuantity ?? null,
      isPreferred: data.isPreferred ?? false,
      notes: data.notes || null,
      createdBy: user.id,
      updatedBy: user.id,
    },
    include: {
      product: {
        select: {
          id: true,
          productName: true,
          sku: true,
          barcode: true,
          currentStock: true,
          unitLabel: true,
        },
      },
      vendor: {
        include: { profile: true },
      },
    },
  });

  return created(reply, newLink, "Product successfully linked to vendor.");
}

export async function batchLinkVendorProductsController(
  request: FastifyRequest<{ Body: BatchLinkVendorProductsType }>,
  reply: FastifyReply
) {
  const data = request.body;
  const user = request.session?.user;
  if (!user) {
    throw AppError.unauthorized();
  }

  const vendor = await prisma.vendor.findFirst({
    where: { id: data.vendorId, deletedAt: null },
  });
  if (!vendor) {
    throw AppError.notFound("Vendor not found.");
  }

  let linkedCount = 0;
  for (const productId of data.productIds) {
    const product = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) continue;

    const existing = await prisma.vendorProduct.findFirst({
      where: { vendorId: data.vendorId, productId },
    });

    if (existing) {
      if (existing.deletedAt) {
        await prisma.vendorProduct.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
            updatedAt: new Date(),
            updatedBy: user.id,
          },
        });
        linkedCount++;
      }
    } else {
      await prisma.vendorProduct.create({
        data: {
          vendorId: data.vendorId,
          productId,
          currency: "IDR",
          createdBy: user.id,
          updatedBy: user.id,
        },
      });
      linkedCount++;
    }
  }

  return success(reply, { vendorId: data.vendorId, linkedCount }, `Successfully linked ${linkedCount} products to vendor.`);
}

export async function batchLinkProductVendorsController(
  request: FastifyRequest<{ Body: BatchLinkProductVendorsType }>,
  reply: FastifyReply
) {
  const data = request.body;
  const user = request.session?.user;
  if (!user) {
    throw AppError.unauthorized();
  }

  const product = await prisma.product.findFirst({
    where: { id: data.productId, deletedAt: null },
  });
  if (!product) {
    throw AppError.notFound("Product not found.");
  }

  let linkedCount = 0;
  for (const vendorId of data.vendorIds) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
    });
    if (!vendor) continue;

    const existing = await prisma.vendorProduct.findFirst({
      where: { vendorId, productId: data.productId },
    });

    if (existing) {
      if (existing.deletedAt) {
        await prisma.vendorProduct.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
            updatedAt: new Date(),
            updatedBy: user.id,
          },
        });
        linkedCount++;
      }
    } else {
      await prisma.vendorProduct.create({
        data: {
          vendorId,
          productId: data.productId,
          currency: "IDR",
          createdBy: user.id,
          updatedBy: user.id,
        },
      });
      linkedCount++;
    }
  }

  return success(reply, { productId: data.productId, linkedCount }, `Successfully linked ${linkedCount} vendors to product.`);
}

export async function updateVendorProductController(
  request: FastifyRequest<{ Body: UpdateVendorProductType }>,
  reply: FastifyReply
) {
  const data = request.body;
  const user = request.session?.user;
  if (!user) {
    throw AppError.unauthorized();
  }

  const existing = await prisma.vendorProduct.findFirst({
    where: { id: data.id, deletedAt: null },
  });
  if (!existing) {
    throw AppError.notFound("Vendor product link not found.");
  }

  const updated = await prisma.vendorProduct.update({
    where: { id: data.id },
    data: {
      vendorSku: data.vendorSku !== undefined ? data.vendorSku : existing.vendorSku,
      vendorPrice: data.vendorPrice !== undefined ? data.vendorPrice : existing.vendorPrice,
      currency: data.currency !== undefined ? data.currency : existing.currency,
      leadTimeDays: data.leadTimeDays !== undefined ? data.leadTimeDays : existing.leadTimeDays,
      minOrderQuantity: data.minOrderQuantity !== undefined ? data.minOrderQuantity : existing.minOrderQuantity,
      isPreferred: data.isPreferred !== undefined ? data.isPreferred : existing.isPreferred,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      updatedAt: new Date(),
      updatedBy: user.id,
    },
    include: {
      product: true,
      vendor: { include: { profile: true } },
    },
  });

  return success(reply, updated, "Vendor product link updated.");
}

export async function deleteVendorProductController(
  request: FastifyRequest<{ Body: DeleteVendorProductType }>,
  reply: FastifyReply
) {
  const data = request.body;
  const user = request.session?.user;
  if (!user) {
    throw AppError.unauthorized();
  }

  const existing = await prisma.vendorProduct.findFirst({
    where: { id: data.id, deletedAt: null },
  });
  if (!existing) {
    throw AppError.notFound("Vendor product link not found.");
  }

  const deleted = await prisma.vendorProduct.update({
    where: { id: data.id },
    data: {
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: user.id,
    },
  });

  return success(reply, deleted, "Vendor product link removed.");
}

export async function getVendorProductsController(
  request: FastifyRequest<{ Querystring: GetVendorProductsQueryType; Body?: GetVendorProductsQueryType }>,
  reply: FastifyReply
) {
  const params = (request.query && Object.keys(request.query).length > 0)
    ? request.query
    : (request.body || {});

  const { page, limit, skip, take, orderBy } = buildPaginationQuery(params, {
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  const where: any = {
    deletedAt: null,
  };

  if (params.vendorId) {
    where.vendorId = Number(params.vendorId);
  }

  if (params.productId) {
    where.productId = Number(params.productId);
  }

  if (params.isPreferred !== undefined) {
    where.isPreferred = params.isPreferred;
  }

  if (params.search && params.search.trim()) {
    const s = params.search.trim();
    where.OR = [
      { vendorSku: { contains: s, mode: "insensitive" } },
      { product: { productName: { contains: s, mode: "insensitive" } } },
      { product: { sku: { contains: s, mode: "insensitive" } } },
      { product: { barcode: { contains: s, mode: "insensitive" } } },
      { vendor: { profile: { firstName: { contains: s, mode: "insensitive" } } } },
      { vendor: { profile: { lastName: { contains: s, mode: "insensitive" } } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.vendorProduct.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        product: {
          select: {
            id: true,
            productName: true,
            sku: true,
            barcode: true,
            currentStock: true,
            unitLabel: true,
            category: {
              select: {
                id: true,
                categoryName: true,
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            vendorgroup: true,
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                isCompany: true,
                phoneNumber: true,
                address: true,
                city: true,
                province: true,
              },
            },
          },
        },
      },
    }),
    prisma.vendorProduct.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);
  return paginated(reply, items, meta, "Vendor products retrieved successfully.", "vendorProducts");
}

export async function getProductsByVendorController(
  request: FastifyRequest<{ Params: { vendorId: string } }>,
  reply: FastifyReply
) {
  const vendorId = Number(request.params.vendorId);
  if (isNaN(vendorId)) {
    throw AppError.badRequest("Invalid vendor ID");
  }

  const items = await prisma.vendorProduct.findMany({
    where: {
      vendorId,
      deletedAt: null,
    },
    include: {
      product: {
        include: {
          category: {
            select: { id: true, categoryName: true },
          },
          productPrice: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: [
      { isPreferred: "desc" },
      { createdAt: "desc" },
    ],
  });

  return success(reply, items, "Vendor products retrieved successfully.");
}

export async function getVendorsByProductController(
  request: FastifyRequest<{ Params: { productId: string } }>,
  reply: FastifyReply
) {
  const productId = Number(request.params.productId);
  if (isNaN(productId)) {
    throw AppError.badRequest("Invalid product ID");
  }

  const items = await prisma.vendorProduct.findMany({
    where: {
      productId,
      deletedAt: null,
    },
    include: {
      vendor: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: [
      { isPreferred: "desc" },
      { vendorPrice: "asc" },
      { createdAt: "desc" },
    ],
  });

  return success(reply, items, "Product vendors retrieved successfully.");
}
