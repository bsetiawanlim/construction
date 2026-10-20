import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createProductInventorySchema,
    getProductInventorySchema,
} from "./productInventorySchema";
import {
    createProductInventoryController,
    getProductInventoryController,
} from "./productInventoryController";

export async function productInventoryRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/product/inventory/create", {
        preHandler: [validateSchema(createProductInventorySchema), authPreHandler, validatePermission],
        handler: createProductInventoryController,
    });

    fastify.post("/api/product/inventory/get", {
        preHandler: [validateSchema(getProductInventorySchema), authPreHandler, validatePermission],
        handler: getProductInventoryController,
    });
}
