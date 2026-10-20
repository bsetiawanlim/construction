import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import {
    CreateProductImageType,
    UpdateProductImageType,
    DeleteProductImageType,
    GetProductImageType
} from "./productImageSchema";

export async function createProductImageController(
    request: FastifyRequest<{ Body: CreateProductImageType }>,
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

    // If this image is primary, unset all other primary images for this product
    if (data.isPrimary) {
        await prisma.productImage.updateMany({
            where: { productId: data.productId, deletedAt: null },
            data: { isPrimary: false },
        });
    }

    const image = await prisma.productImage.create({
        data: {
            productId: data.productId,
            imageUrl: data.imageUrl,
            altText: data.altText ?? null,
            isPrimary: data.isPrimary ?? false,
            sortOrder: data.sortOrder ?? 0,
            createdBy: user.id,
            updatedBy: user.id,
        },
    });

    return created(reply, image, "Product image successfully created.");
}

export async function updateProductImageController(
    request: FastifyRequest<{ Body: UpdateProductImageType }>,
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

    const existingImage = await prisma.productImage.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingImage) {
        throw AppError.notFound("Product image not found.");
    }

    // If setting as primary, unset all other primary images for this product
    if (data.isPrimary) {
        await prisma.productImage.updateMany({
            where: { productId: existingImage.productId, deletedAt: null, id: { not: data.id } },
            data: { isPrimary: false },
        });
    }

    const image = await prisma.productImage.update({
        where: { id: data.id },
        data: {
            ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
            ...(data.altText !== undefined && { altText: data.altText }),
            ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
            ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
            updatedAt: new Date(),
            updatedBy: user.id,
        },
    });

    return success(reply, image, "Product image successfully updated.");
}

export async function deleteProductImageController(
    request: FastifyRequest<{ Body: DeleteProductImageType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data?.id) {
        throw AppError.badRequest("Image id is required.");
    }

    const existingImage = await prisma.productImage.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingImage) {
        throw AppError.notFound("Product image not found.");
    }

    const image = await prisma.productImage.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, image, "Product image successfully deleted.");
}

export async function getProductImageController(
    request: FastifyRequest<{ Body: GetProductImageType }>,
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

    const images = await prisma.productImage.findMany({
        where: { productId: data.productId, deletedAt: null },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    });

    return success(reply, images, "Product images successfully fetched.", 200, { images });
}
