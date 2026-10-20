import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createRfqProductSchema,
    updateRfqProductSchema,
    deleteRfqProductSchema,
    getRfqProductSchema,
} from "./rfqProductSchema";
import {
    createRfqProductController,
    updateRfqProductController,
    deleteRfqProductController,
    getRfqProductsByRfqController,
} from "./rfqProductController";

export async function rfqProductRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/rfq/product/create", {
        preHandler: [validateSchema(createRfqProductSchema), authPreHandler, validatePermission],
        handler: createRfqProductController,
    });

    fastify.post("/api/rfq/product/update", {
        preHandler: [validateSchema(updateRfqProductSchema), authPreHandler, validatePermission],
        handler: updateRfqProductController,
    });

    fastify.post("/api/rfq/product/delete", {
        preHandler: [validateSchema(deleteRfqProductSchema), authPreHandler, validatePermission],
        handler: deleteRfqProductController,
    });

    fastify.post("/api/rfq/product/get-by-rfq", {
        preHandler: [validateSchema(getRfqProductSchema), authPreHandler, validatePermission],
        handler: getRfqProductsByRfqController,
    });
}
