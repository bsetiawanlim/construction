import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success, paginated } from "../../../utils/response";
import { buildPaginationQuery, buildPaginationMeta, buildSearchFilter, PaginationQuery } from "../../../utils/pagination";
import { TypedHandler } from "../../../types/fastify";
import {
    CreatePurchaseOrderType,
    UpdatePurchaseOrderType,
    DeletePurchaseOrderType,
    GetPurchaseOrderType,
} from "./purchaseOrderSchema";

const PO_COMMON_INCLUDE = {
    purchaseOrderReference: true,
    purchaseOrderVendor: {
        include: {
            profile: true,
        },
    },
    destinationFacility: true,
    purchaseOrderProducts: {
        where: { deletedAt: null },
        include: {
            purchaseOrderProduct: {
                select: {
                    id: true,
                    productName: true,
                    sku: true,
                    unitLabel: true,
                    unit: true,
                },
            },
            unit: true,
        },
    },
};

export const createPurchaseOrderController: TypedHandler<CreatePurchaseOrderType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    // Validate RFQ exists
    const existingRfq = await prisma.rfq.findFirst({
        where: { id: data.rfqId, deletedAt: null },
    });
    if (!existingRfq) {
        throw AppError.notFound("RFQ not found.");
    }

    // One PO per RFQ (unique rfqId constraint)
    const existingPO = await prisma.purchaseOrder.findFirst({
        where: { rfqId: data.rfqId },
    });
    if (existingPO) {
        if (existingPO.deletedAt === null) {
            throw AppError.conflict("A purchase order already exists for this RFQ.");
        } else {
            // Clean up soft-deleted PO shell to satisfy postgres unique constraint
            await prisma.purchaseOrderProduct.deleteMany({ where: { purchaseOrderId: existingPO.id } });
            await prisma.purchaseOrder.delete({ where: { id: existingPO.id } });
        }
    }

    // Unique PO number
    const existingNumber = await prisma.purchaseOrder.findFirst({
        where: { number: data.number },
    });
    if (existingNumber) {
        throw AppError.conflict("Purchase order number already exists.");
    }

    // Validate vendor
    const existingVendor = await prisma.vendor.findFirst({
        where: { id: data.vendorId, deletedAt: null },
    });
    if (!existingVendor) {
        throw AppError.notFound("Vendor not found.");
    }

    // Validate product IDs if provided
    const items = data.products || [];
    if (items.length > 0) {
        const productIds = items.map((p) => p.productId);
        const foundProducts = await prisma.product.findMany({
            where: { id: { in: productIds }, deletedAt: null },
            select: { id: true, description: true },
        });
        const foundSet = new Set(foundProducts.map((p) => p.id));
        const missing = productIds.filter((id) => !foundSet.has(id));
        if (missing.length > 0) {
            throw AppError.notFound(`Products not found: ${missing.join(", ")}`);
        }

        // Validate that none of the products are formula products (manufactured from BOM / recipe)
        const formulaProducts = await prisma.productRecipe.findMany({
            where: { productId: { in: productIds }, deletedAt: null },
            select: { productId: true },
        });
        const formulaIds = new Set(formulaProducts.map((fp) => fp.productId));
        foundProducts.forEach((p) => {
            if (p.description && p.description.includes("---RECIPE_SPEC_START---")) {
                formulaIds.add(p.id);
            }
        });
        if (formulaIds.size > 0) {
            throw AppError.badRequest(
                `Product(s) with ID(s) ${Array.from(formulaIds).join(", ")} are formula products. Purchase orders can only be issued for raw materials and purchasable items.`
            );
        }
    }

    // Calculate total amount if not explicitly given or auto-sum from product lines
    let computedTotal = data.totalAmount ?? 0;
    if (items.length > 0) {
        const lineSum = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price ?? 0)), 0);
        if (lineSum > 0 || !data.totalAmount) {
            computedTotal = lineSum;
        }
    }

    // Create PO and product lines atomically
    const purchaseOrder = await prisma.$transaction(async (tx) => {
        const createdPO = await tx.purchaseOrder.create({
            data: {
                rfqId:                 data.rfqId,
                vendorId:              data.vendorId,
                destinationFacilityId: data.destinationFacilityId ?? undefined,
                number:                data.number,
                title:                 data.title,
                date:                  data.date ? new Date(data.date) : new Date(),
                dueDate:               new Date(data.dueDate),
                status:                data.status,
                notes:                 data.notes ?? undefined,
                totalAmount:           computedTotal,
                createdAt:             new Date(),
                updatedAt:             new Date(),
                createdBy:             user.id,
                updatedBy:             user.id,
            },
        });

        if (items.length > 0) {
            await tx.purchaseOrderProduct.createMany({
                data: items.map((item) => ({
                    purchaseOrderId: createdPO.id,
                    productId:       item.productId,
                    unitId:          item.unitId ?? undefined,
                    quantity:        item.quantity,
                    price:           item.price ?? 0,
                    notes:           item.notes ?? "",
                    createdAt:       new Date(),
                    updatedAt:       new Date(),
                    createdBy:       user.id,
                    updatedBy:       user.id,
                })),
            });
        }

        return tx.purchaseOrder.findUnique({
            where: { id: createdPO.id },
            include: PO_COMMON_INCLUDE,
        });
    });

    return created(reply, { purchaseOrder }, "Purchase order successfully created.");
};

export const updatePurchaseOrderController: TypedHandler<UpdatePurchaseOrderType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Purchase order id is required");
    }

    const existing = await prisma.purchaseOrder.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Purchase order not found.");
    }

    const items = data.products;
    if (items && items.length > 0) {
        const productIds = items.map((p) => p.productId);
        const foundProducts = await prisma.product.findMany({
            where: { id: { in: productIds }, deletedAt: null },
            select: { id: true, description: true },
        });
        const foundSet = new Set(foundProducts.map((p) => p.id));
        const missing = productIds.filter((id) => !foundSet.has(id));
        if (missing.length > 0) {
            throw AppError.notFound(`Products not found: ${missing.join(", ")}`);
        }

        // Validate that none of the products are formula products (manufactured from BOM / recipe)
        const formulaProducts = await prisma.productRecipe.findMany({
            where: { productId: { in: productIds }, deletedAt: null },
            select: { productId: true },
        });
        const formulaIds = new Set(formulaProducts.map((fp) => fp.productId));
        foundProducts.forEach((p) => {
            if (p.description && p.description.includes("---RECIPE_SPEC_START---")) {
                formulaIds.add(p.id);
            }
        });
        if (formulaIds.size > 0) {
            throw AppError.badRequest(
                `Product(s) with ID(s) ${Array.from(formulaIds).join(", ")} are formula products. Purchase orders can only be issued for raw materials and purchasable items.`
            );
        }
    }

    let computedTotal = data.totalAmount;
    if (items && items.length > 0 && computedTotal === undefined) {
        computedTotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price ?? 0)), 0);
    }

    const purchaseOrder = await prisma.$transaction(async (tx) => {
        // If product lines are supplied, replace existing active product lines
        if (items !== undefined) {
            await tx.purchaseOrderProduct.deleteMany({
                where: { purchaseOrderId: data.id },
            });

            if (items.length > 0) {
                await tx.purchaseOrderProduct.createMany({
                    data: items.map((item) => ({
                        purchaseOrderId: data.id,
                        productId:       item.productId,
                        unitId:          item.unitId ?? undefined,
                        quantity:        item.quantity,
                        price:           item.price ?? 0,
                        notes:           item.notes ?? "",
                        createdAt:       new Date(),
                        updatedAt:       new Date(),
                        createdBy:       user.id,
                        updatedBy:       user.id,
                    })),
                });
            }
        }

        return tx.purchaseOrder.update({
            where: { id: data.id },
            data: {
                ...(data.destinationFacilityId !== undefined && { destinationFacilityId: data.destinationFacilityId }),
                ...(data.title       !== undefined && { title: data.title }),
                ...(data.date        !== undefined && { date: new Date(data.date) }),
                ...(data.dueDate     !== undefined && { dueDate: new Date(data.dueDate) }),
                ...(data.status      !== undefined && { status: data.status }),
                ...(data.notes       !== undefined && { notes: data.notes }),
                ...(computedTotal    !== undefined && { totalAmount: computedTotal }),
                updatedAt: new Date(),
                updatedBy: user.id,
            },
            include: PO_COMMON_INCLUDE,
        });
    });

    return success(reply, { purchaseOrder }, "Purchase order successfully updated.");
};

export const deletePurchaseOrderController: TypedHandler<DeletePurchaseOrderType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Purchase order id is required");
    }

    const existing = await prisma.purchaseOrder.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Purchase order not found.");
    }

    const purchaseOrder = await prisma.purchaseOrder.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { purchaseOrder }, "Purchase order successfully deleted.");
};

export const getPurchaseOrderController: TypedHandler<GetPurchaseOrderType> = async (request, reply) => {
    const data = request.body;

    if (!data?.id) {
        throw AppError.badRequest("Purchase order id is required");
    }

    const purchaseOrder = await prisma.purchaseOrder.findFirst({
        where: { id: data.id, deletedAt: null },
        include: PO_COMMON_INCLUDE,
    });

    if (!purchaseOrder) {
        throw AppError.notFound("Purchase order not found.");
    }

    return success(reply, { purchaseOrder }, "Purchase order successfully fetched.");
};

export const getPurchaseOrdersController: TypedHandler<unknown, unknown, PaginationQuery> = async (request, reply) => {
    const { page, limit, skip } = buildPaginationQuery(request.query);
    const searchFilter = buildSearchFilter(request.query.search, ["number", "title", "notes"]);

    const where: any = {
        deletedAt: null,
        ...searchFilter,
    };

    if (request.query?.destinationFacilityId) {
        where.destinationFacilityId = Number(request.query.destinationFacilityId);
    }
    if (request.query?.status) {
        where.status = request.query.status;
    }

    const [purchaseOrders, total] = await Promise.all([
        prisma.purchaseOrder.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: PO_COMMON_INCLUDE,
        }),
        prisma.purchaseOrder.count({ where }),
    ]);

    const meta = buildPaginationMeta(total, page, limit);
    return paginated(reply, purchaseOrders, meta, "Purchase orders successfully fetched.");
};
