import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import {
    CreateProductPriceType,
    UpdateProductPriceType,
    DeleteProductPriceType,
    GetProductPriceType
} from "./productPriceSchema";

export async function createProductPriceController(
    request: FastifyRequest<{ Body: CreateProductPriceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingProduct = await prisma.product.findFirst({
        where: { id: data.productId, deletedAt: null },
    });
    if (!existingProduct) {
        throw AppError.notFound("Product not found.");
    }

    const price = await prisma.productPrice.create({
        data: {
            productId: data.productId,
            customerGroup: data.customerGroup ?? null,
            amount: data.amount,
            priceType: data.priceType,
            startDate: data.startDate ? new Date(data.startDate) : new Date(),
            endDate: data.endDate ? new Date(data.endDate) : null,
            currency: data.currency ?? "IDR",
            createdBy: user.id,
            updatedBy: user.id,
        },
    });

    return created(reply, price, "Product price successfully created.");
}

export async function updateProductPriceController(
    request: FastifyRequest<{ Body: UpdateProductPriceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data) {
        throw AppError.badRequest("No data provided");
    }

    const existingPrice = await prisma.productPrice.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingPrice) {
        throw AppError.notFound("Product price not found.");
    }

    const price = await prisma.productPrice.update({
        where: { id: data.id },
        data: {
            ...(data.customerGroup !== undefined && { customerGroup: data.customerGroup }),
            ...(data.amount !== undefined && { amount: data.amount }),
            ...(data.priceType !== undefined && { priceType: data.priceType }),
            ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
            ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
            ...(data.currency !== undefined && { currency: data.currency }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, price, "Product price successfully updated.");
}

export async function deleteProductPriceController(
    request: FastifyRequest<{ Body: DeleteProductPriceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data?.id) {
        throw AppError.badRequest("Price id is required.");
    }

    const existingPrice = await prisma.productPrice.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingPrice) {
        throw AppError.notFound("Product price not found.");
    }

    const price = await prisma.productPrice.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, price, "Product price successfully deleted.");
}

export async function getProductPriceController(
    request: FastifyRequest<{ Body: GetProductPriceType }>,
    reply: FastifyReply
) {
    const data = request.body;
    if (!data?.productId) {
        throw AppError.badRequest("Product id is required.");
    }

    const existingProduct = await prisma.product.findFirst({
        where: { id: data.productId, deletedAt: null },
    });
    if (!existingProduct) {
        throw AppError.notFound("Product not found.");
    }

    const prices = await prisma.productPrice.findMany({
        where: { productId: data.productId, deletedAt: null },
        orderBy: { startDate: "desc" },
    });

    return success(reply, prices, "Product prices successfully fetched.", 200, { prices });
}
