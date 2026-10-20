import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createRfqSchema,
    createRfqWithProductsSchema,
    updateRfqSchema,
    deleteRfqSchema,
    getRfqSchema,
} from "./rfqSchema";
import {
    createRfqController,
    createRfqWithProductsController,
    updateRfqController,
    deleteRfqController,
    getRfqController,
    getRfqsController,
} from "./rfqController";

export async function rfqRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/rfq/create", {
        preHandler: [validateSchema(createRfqSchema), authPreHandler, validatePermission],
        handler: createRfqController,
    });

    fastify.post("/api/rfq/create-with-products", {
        preHandler: [validateSchema(createRfqWithProductsSchema), authPreHandler, validatePermission],
        handler: createRfqWithProductsController,
    });

    fastify.post("/api/rfq/update", {
        preHandler: [validateSchema(updateRfqSchema), authPreHandler, validatePermission],
        handler: updateRfqController,
    });

    fastify.post("/api/rfq/delete", {
        preHandler: [validateSchema(deleteRfqSchema), authPreHandler, validatePermission],
        handler: deleteRfqController,
    });

    fastify.post("/api/rfq/get", {
        preHandler: [validateSchema(getRfqSchema), authPreHandler, validatePermission],
        handler: getRfqController,
    });

    fastify.get("/api/rfq/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getRfqsController,
    });
}
