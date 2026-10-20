import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createWorkOfferItemSchema,
    updateWorkOfferItemSchema,
    deleteWorkOfferItemSchema,
    getWorkOfferItemSchema,
    getWorkOfferItemsByOfferSchema,
} from "./workOfferItemSchema";
import {
    createWorkOfferItemController,
    updateWorkOfferItemController,
    deleteWorkOfferItemController,
    getWorkOfferItemController,
    getWorkOfferItemsByOfferController,
    getAllWorkOfferItemsController,
} from "./workOfferItemController";

export async function workOfferItemRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/work-offer-item/create", {
        preHandler: [validateSchema(createWorkOfferItemSchema), authPreHandler, validatePermission],
        handler: createWorkOfferItemController,
    });

    fastify.post("/api/work-offer-item/update", {
        preHandler: [validateSchema(updateWorkOfferItemSchema), authPreHandler, validatePermission],
        handler: updateWorkOfferItemController,
    });

    fastify.post("/api/work-offer-item/delete", {
        preHandler: [validateSchema(deleteWorkOfferItemSchema), authPreHandler, validatePermission],
        handler: deleteWorkOfferItemController,
    });

    fastify.post("/api/work-offer-item/get", {
        preHandler: [validateSchema(getWorkOfferItemSchema), authPreHandler, validatePermission],
        handler: getWorkOfferItemController,
    });

    fastify.post("/api/work-offer-item/get-by-offer", {
        preHandler: [validateSchema(getWorkOfferItemsByOfferSchema), authPreHandler, validatePermission],
        handler: getWorkOfferItemsByOfferController,
    });

    fastify.get("/api/work-offer-item/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getAllWorkOfferItemsController,
    });
}
