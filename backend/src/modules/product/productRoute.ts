import { FastifyInstance } from "fastify";
import { authPreHandler } from "../personal/auth/authController";
import { validateSchema } from "../../plugins/zod";
import validatePermission from "../../plugins/permission";
import {
    createProductSchema,
    updateProductSchema,
    deleteProductSchema,
    getProductSchema,
    getProductsSchema,
} from "./productSchema";
import {
    createProductController,
    updateProductController,
    deleteProductController,
    getProductController,
    getProductsController,
} from "./productController";

export async function productRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/product/create", {
        preHandler: [validateSchema(createProductSchema), authPreHandler, validatePermission],
        handler: createProductController,
    });

    fastify.post("/api/product/update", {
        preHandler: [validateSchema(updateProductSchema), authPreHandler, validatePermission],
        handler: updateProductController,
    });

    fastify.post("/api/product/delete", {
        preHandler: [validateSchema(deleteProductSchema), authPreHandler, validatePermission],
        handler: deleteProductController,
    });

    fastify.post("/api/product/get", {
        preHandler: [validateSchema(getProductSchema), authPreHandler, validatePermission],
        handler: getProductController,
    });

    fastify.post("/api/product/get-all", {
        preHandler: [validateSchema(getProductsSchema), authPreHandler, validatePermission],
        handler: getProductsController,
    });
}
