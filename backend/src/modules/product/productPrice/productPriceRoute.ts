import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createProductPriceSchema,
    updateProductPriceSchema,
    deleteProductPriceSchema,
    getProductPriceSchema,
} from "./productPriceSchema";
import {
    createProductPriceController,
    updateProductPriceController,
    deleteProductPriceController,
    getProductPriceController,
} from "./productPriceController";

export async function productPriceRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/product/price/create", {
        preHandler: [validateSchema(createProductPriceSchema), authPreHandler, validatePermission],
        handler: createProductPriceController,
    });

    fastify.post("/api/product/price/update", {
        preHandler: [validateSchema(updateProductPriceSchema), authPreHandler, validatePermission],
        handler: updateProductPriceController,
    });

    fastify.post("/api/product/price/delete", {
        preHandler: [validateSchema(deleteProductPriceSchema), authPreHandler, validatePermission],
        handler: deleteProductPriceController,
    });

    fastify.post("/api/product/price/get", {
        preHandler: [validateSchema(getProductPriceSchema), authPreHandler, validatePermission],
        handler: getProductPriceController,
    });
}
