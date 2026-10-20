import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { created, success } from "../../../utils/response";
import { TypedHandler } from "../../../types/fastify";
import {
    CreatePurchaseOrderProductType,
    UpdatePurchaseOrderProductType,
    DeletePurchaseOrderProductType,
    GetPurchaseOrderProductType,
} from "./purchaseOrderProductSchema";

export const createPurchaseOrderProductController: TypedHandler<CreatePurchaseOrderProductType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingPO = await prisma.purchaseOrder.findFirst({
        where: { id: data.purchaseOrderId, deletedAt: null },
    });
    if (!existingPO) {
        throw AppError.notFound("Purchase order not found.");
    }

    const existingProduct = await prisma.product.findFirst({
        where: { id: data.productId, deletedAt: null },
    });
    if (!existingProduct) {
        throw AppError.notFound("Product not found.");
    }

    const isFormula = await prisma.productRecipe.findFirst({
        where: { productId: data.productId, deletedAt: null },
    });
    if (isFormula || (existingProduct.description && existingProduct.description.includes("---RECIPE_SPEC_START---"))) {
        throw AppError.badRequest(
            "Cannot add a formula product to a purchase order. Purchase orders can only be issued for raw materials and purchasable items."
        );
    }

    const duplicate = await prisma.purchaseOrderProduct.findFirst({
        where: { purchaseOrderId: data.purchaseOrderId, productId: data.productId, deletedAt: null },
    });
    if (duplicate) {
        throw AppError.conflict("Product already added to this purchase order.");
    }

    const purchaseOrderProduct = await prisma.purchaseOrderProduct.create({
        data: {
            purchaseOrderId: data.purchaseOrderId,
            productId:       data.productId,
            unitId:          data.unitId ?? undefined,
            quantity:        data.quantity,
            price:           data.price,
            notes:           data.notes ?? undefined,
            createdAt:       new Date(),
            updatedAt:       new Date(),
            createdBy:       user.id,
            updatedBy:       user.id,
        },
        include: { purchaseOrderProduct: true },
    });

    return created(reply, { purchaseOrderProduct }, "Purchase order product successfully added.");
};

export const updatePurchaseOrderProductController: TypedHandler<UpdatePurchaseOrderProductType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Purchase order product id is required");
    }

    const existing = await prisma.purchaseOrderProduct.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Purchase order product not found.");
    }

    const purchaseOrderProduct = await prisma.purchaseOrderProduct.update({
        where: { id: data.id },
        data: {
            ...(data.unitId   !== undefined && { unitId: data.unitId }),
            ...(data.quantity !== undefined && { quantity: data.quantity }),
            ...(data.price    !== undefined && { price: data.price }),
            ...(data.notes    !== undefined && { notes: data.notes }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { purchaseOrderProduct: true },
    });

    return success(reply, { purchaseOrderProduct }, "Purchase order product successfully updated.");
};

export const deletePurchaseOrderProductController: TypedHandler<DeletePurchaseOrderProductType> = async (request, reply) => {
    const data = request.body;
    const user = request.session?.user;

    if (!user) {
        throw AppError.unauthorized("Authentication required");
    }

    if (!data?.id) {
        throw AppError.badRequest("Purchase order product id is required");
    }

    const existing = await prisma.purchaseOrderProduct.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existing) {
        throw AppError.notFound("Purchase order product not found.");
    }

    const purchaseOrderProduct = await prisma.purchaseOrderProduct.update({
        where: { id: data.id },
        data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, { purchaseOrderProduct }, "Purchase order product successfully removed.");
};

export const getPurchaseOrderProductsController: TypedHandler<GetPurchaseOrderProductType> = async (request, reply) => {
    const data = request.body;

    if (!data?.purchaseOrderId) {
        throw AppError.badRequest("purchaseOrderId is required");
    }

    const products = await prisma.purchaseOrderProduct.findMany({
        where: { purchaseOrderId: data.purchaseOrderId, deletedAt: null },
        include: { purchaseOrderProduct: true },
        orderBy: { createdAt: "asc" },
    });

    return success(reply, { products }, "Purchase order products successfully fetched.");
};
