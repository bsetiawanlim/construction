import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createRequestSourceSchema,
    deleteRequestSourceSchema,
    createRequestSchema,
    updateRequestSchema,
    deleteRequestSchema,
    getRequestSchema,
    createRequestProductSchema,
    updateRequestProductSchema,
    deleteRequestProductSchema,
    getRequestProductSchema,
} from "./requestSchema";
import {
    createRequestSourceController,
    deleteRequestSourceController,
    getRequestSourcesController,
    createRequestController,
    updateRequestController,
    deleteRequestController,
    getRequestController,
    getRequestsController,
    createRequestProductController,
    updateRequestProductController,
    deleteRequestProductController,
    getRequestProductsByRequestController,
} from "./requestController";

export async function requestRoutes(fastify: FastifyInstance, options: any) {
    // ── Request Source ─────────────────────────────────────────────
    fastify.post("/api/request/source/create", {
        preHandler: [validateSchema(createRequestSourceSchema), authPreHandler, validatePermission],
        handler: createRequestSourceController,
    });

    fastify.post("/api/request/source/delete", {
        preHandler: [validateSchema(deleteRequestSourceSchema), authPreHandler, validatePermission],
        handler: deleteRequestSourceController,
    });

    fastify.get("/api/request/source/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getRequestSourcesController,
    });

    // ── Request ────────────────────────────────────────────────────
    fastify.post("/api/request/create", {
        preHandler: [validateSchema(createRequestSchema), authPreHandler, validatePermission],
        handler: createRequestController,
    });

    fastify.post("/api/request/update", {
        preHandler: [validateSchema(updateRequestSchema), authPreHandler, validatePermission],
        handler: updateRequestController,
    });

    fastify.post("/api/request/delete", {
        preHandler: [validateSchema(deleteRequestSchema), authPreHandler, validatePermission],
        handler: deleteRequestController,
    });

    fastify.post("/api/request/get", {
        preHandler: [validateSchema(getRequestSchema), authPreHandler, validatePermission],
        handler: getRequestController,
    });

    fastify.get("/api/request/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getRequestsController,
    });

    // ── Request Product ────────────────────────────────────────────
    fastify.post("/api/request/product/create", {
        preHandler: [validateSchema(createRequestProductSchema), authPreHandler, validatePermission],
        handler: createRequestProductController,
    });

    fastify.post("/api/request/product/update", {
        preHandler: [validateSchema(updateRequestProductSchema), authPreHandler, validatePermission],
        handler: updateRequestProductController,
    });

    fastify.post("/api/request/product/delete", {
        preHandler: [validateSchema(deleteRequestProductSchema), authPreHandler, validatePermission],
        handler: deleteRequestProductController,
    });

    fastify.post("/api/request/product/get-by-request", {
        preHandler: [validateSchema(getRequestProductSchema), authPreHandler, validatePermission],
        handler: getRequestProductsByRequestController,
    });
}
