import { FastifyInstance } from "fastify";
import { authPreHandler } from "../personal/auth/authController";
import { validateSchema } from "../../plugins/zod";
import validatePermission from "../../plugins/permission";
import {
    createProductCategorySchema,
    updateProductCategorySchema,
    deleteProductCategorySchema,
    getProductCategorySchema,
} from "./productCategorySchema";
import {
    createProductCategoryController,
    updateProductCategoryController,
    deleteProductCategoryController,
    getProductCategoryController,
    getProductCategoryByIdController,
} from "./productCategoryController";

export async function productCategoryRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/product-category/create", {
        preHandler: [validateSchema(createProductCategorySchema), authPreHandler, validatePermission],
        handler: createProductCategoryController,
    });

    fastify.post("/api/product-category/update", {
        preHandler: [validateSchema(updateProductCategorySchema), authPreHandler, validatePermission],
        handler: updateProductCategoryController,
    });

    fastify.post("/api/product-category/delete", {
        preHandler: [validateSchema(deleteProductCategorySchema), authPreHandler, validatePermission],
        handler: deleteProductCategoryController,
    });

    fastify.post("/api/product-category/get", {
        preHandler: [validateSchema(getProductCategorySchema), authPreHandler, validatePermission],
        handler: getProductCategoryByIdController,
    });

    fastify.post("/api/product-category/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getProductCategoryController,
    });
}
