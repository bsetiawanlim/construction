import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createProductAttributeValueSchema,
    updateProductAttributeValueSchema,
    deleteProductAttributeValueSchema,
    getProductAttributeValueSchema,
} from "./productAttributeValueSchema";
import {
    createProductAttributeValueController,
    updateProductAttributeValueController,
    deleteProductAttributeValueController,
    getProductAttributeValuesController,
} from "./productAttributeValueController";

export async function productAttributeValueRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/product/attribute-value/create", {
        preHandler: [validateSchema(createProductAttributeValueSchema), authPreHandler, validatePermission],
        handler: createProductAttributeValueController,
    });

    fastify.post("/api/product/attribute-value/update", {
        preHandler: [validateSchema(updateProductAttributeValueSchema), authPreHandler, validatePermission],
        handler: updateProductAttributeValueController,
    });

    fastify.post("/api/product/attribute-value/delete", {
        preHandler: [validateSchema(deleteProductAttributeValueSchema), authPreHandler, validatePermission],
        handler: deleteProductAttributeValueController,
    });

    fastify.post("/api/product/attribute-value/get", {
        preHandler: [validateSchema(getProductAttributeValueSchema), authPreHandler, validatePermission],
        handler: getProductAttributeValuesController,
    });
}
