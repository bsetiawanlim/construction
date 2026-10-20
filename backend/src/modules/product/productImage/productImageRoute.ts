import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createProductImageSchema,
    updateProductImageSchema,
    deleteProductImageSchema,
    getProductImageSchema,
} from "./productImageSchema";
import {
    createProductImageController,
    updateProductImageController,
    deleteProductImageController,
    getProductImageController,
} from "./productImageController";

export async function productImageRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/product/image/create", {
        preHandler: [validateSchema(createProductImageSchema), authPreHandler, validatePermission],
        handler: createProductImageController,
    });

    fastify.post("/api/product/image/update", {
        preHandler: [validateSchema(updateProductImageSchema), authPreHandler, validatePermission],
        handler: updateProductImageController,
    });

    fastify.post("/api/product/image/delete", {
        preHandler: [validateSchema(deleteProductImageSchema), authPreHandler, validatePermission],
        handler: deleteProductImageController,
    });

    fastify.post("/api/product/image/get", {
        preHandler: [validateSchema(getProductImageSchema), authPreHandler, validatePermission],
        handler: getProductImageController,
    });
}
