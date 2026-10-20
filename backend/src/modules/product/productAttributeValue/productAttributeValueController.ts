import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../plugins/prisma";
import { AppError } from "../../../utils/errors";
import { success, created } from "../../../utils/response";
import {
    CreateProductAttributeValueType,
    UpdateProductAttributeValueType,
    DeleteProductAttributeValueType,
    GetProductAttributeValueType
} from "./productAttributeValueSchema";

export async function createProductAttributeValueController(
    request: FastifyRequest<{ Body: CreateProductAttributeValueType }>,
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

    const existingAttribute = await prisma.productAttribute.findFirst({
        where: { id: data.attributeId, deletedAt: null },
    });
    if (!existingAttribute) {
        throw AppError.notFound("Product attribute not found.");
    }

    // Prevent duplicate attribute assignment to same product
    const existingValue = await prisma.productAttributeValue.findFirst({
        where: { productId: data.productId, attributeId: data.attributeId, deletedAt: null },
    });
    if (existingValue) {
        throw AppError.conflict("This attribute is already assigned to the product. Use update instead.");
    }

    const value = await prisma.productAttributeValue.create({
        data: {
            productId: data.productId,
            attributeId: data.attributeId,
            value: data.value,
            createdBy: user.id,
            updatedBy: user.id,
        },
        include: { attribute: true },
    });

    return created(reply, value, "Product attribute value successfully created.");
}

export async function updateProductAttributeValueController(
    request: FastifyRequest<{ Body: UpdateProductAttributeValueType }>,
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

    const existingValue = await prisma.productAttributeValue.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingValue) {
        throw AppError.notFound("Product attribute value not found.");
    }

    const value = await prisma.productAttributeValue.update({
        where: { id: data.id },
        data: {
            value: data.value,
            updatedAt: new Date(),
            updatedBy: user.id,
        },
        include: { attribute: true },
    });

    return success(reply, value, "Product attribute value successfully updated.");
}

export async function deleteProductAttributeValueController(
    request: FastifyRequest<{ Body: DeleteProductAttributeValueType }>,
    reply: FastifyReply
) {
    const data = request.body;
    const user = request.session?.user;
    if (!user) {
        throw AppError.unauthorized();
    }
    if (!data?.id) {
        throw AppError.badRequest("Attribute value id is required.");
    }

    const existingValue = await prisma.productAttributeValue.findFirst({
        where: { id: data.id, deletedAt: null },
    });
    if (!existingValue) {
        throw AppError.notFound("Product attribute value not found.");
    }

    const value = await prisma.productAttributeValue.update({
        where: { id: data.id },
        data: { deletedAt: new Date(), updatedAt: new Date(), updatedBy: user.id },
    });

    return success(reply, value, "Product attribute value successfully deleted.");
}

export async function getProductAttributeValuesController(
    request: FastifyRequest<{ Body: GetProductAttributeValueType }>,
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

    const values = await prisma.productAttributeValue.findMany({
        where: { productId: data.productId, deletedAt: null },
        include: { attribute: true },
        orderBy: { attribute: { name: "asc" } },
    });

    return success(reply, values, "Product attribute values successfully fetched.", 200, { values });
}
