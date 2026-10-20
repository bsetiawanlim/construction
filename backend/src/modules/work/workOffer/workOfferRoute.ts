import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createWorkOfferSchema,
    updateWorkOfferSchema,
    deleteWorkOfferSchema,
    getWorkOfferSchema,
} from "./workOfferSchema";
import {
    createWorkOfferController,
    updateWorkOfferController,
    deleteWorkOfferController,
    getWorkOfferController,
    getWorkOffersController,
} from "./workOfferController";

export async function workOfferRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/work-offer/create", {
        preHandler: [validateSchema(createWorkOfferSchema), authPreHandler, validatePermission],
        handler: createWorkOfferController,
    });

    fastify.post("/api/work-offer/update", {
        preHandler: [validateSchema(updateWorkOfferSchema), authPreHandler, validatePermission],
        handler: updateWorkOfferController,
    });

    fastify.post("/api/work-offer/delete", {
        preHandler: [validateSchema(deleteWorkOfferSchema), authPreHandler, validatePermission],
        handler: deleteWorkOfferController,
    });

    fastify.post("/api/work-offer/get", {
        preHandler: [validateSchema(getWorkOfferSchema), authPreHandler, validatePermission],
        handler: getWorkOfferController,
    });

    fastify.get("/api/work-offer/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getWorkOffersController,
    });
}
