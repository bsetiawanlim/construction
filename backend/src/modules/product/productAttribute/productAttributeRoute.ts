import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createProductAttributeSchema,
    updateProductAttributeSchema,
    deleteProductAttributeSchema,
} from "./productAttributeSchema";
import {
    createProductAttributeController,
    updateProductAttributeController,
    deleteProductAttributeController,
    getProductAttributesController,
} from "./productAttributeController";

export async function productAttributeRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/product/attribute/create", {
        preHandler: [validateSchema(createProductAttributeSchema), authPreHandler, validatePermission],
        handler: createProductAttributeController,
    });

    fastify.post("/api/product/attribute/update", {
        preHandler: [validateSchema(updateProductAttributeSchema), authPreHandler, validatePermission],
        handler: updateProductAttributeController,
    });

    fastify.post("/api/product/attribute/delete", {
        preHandler: [validateSchema(deleteProductAttributeSchema), authPreHandler, validatePermission],
        handler: deleteProductAttributeController,
    });

    fastify.post("/api/product/attribute/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getProductAttributesController,
    });
}
