import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createItemSchema,
    updateItemSchema,
    deleteItemSchema,
    getItemSchema,
    getItemsByProductSchema,
} from "./itemSchema";
import {
    addItemController,
    updateItemController,
    deleteItemController,
    getItemController,
    getItemsByProductController,
    getAllItemsController,
} from "./itemController";

export async function itemRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/item/create", {
        preHandler: [validateSchema(createItemSchema), authPreHandler, validatePermission],
        handler: addItemController,
    });

    fastify.post("/api/item/update", {
        preHandler: [validateSchema(updateItemSchema), authPreHandler, validatePermission],
        handler: updateItemController,
    });

    fastify.post("/api/item/delete", {
        preHandler: [validateSchema(deleteItemSchema), authPreHandler, validatePermission],
        handler: deleteItemController,
    });

    fastify.post("/api/item/get", {
        preHandler: [validateSchema(getItemSchema), authPreHandler, validatePermission],
        handler: getItemController,
    });

    fastify.post("/api/item/get-by-product", {
        preHandler: [validateSchema(getItemsByProductSchema), authPreHandler, validatePermission],
        handler: getItemsByProductController,
    });

    fastify.get("/api/item/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getAllItemsController,
    });
}
