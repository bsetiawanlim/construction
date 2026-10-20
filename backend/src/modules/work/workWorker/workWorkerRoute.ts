import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createWorkWorkerSchema,
    updateWorkWorkerSchema,
    deleteWorkWorkerSchema,
    getWorkWorkerSchema,
    getWorkWorkersByWorkSchema,
} from "./workWorkerSchema";
import {
    createWorkWorkerController,
    updateWorkWorkerController,
    deleteWorkWorkerController,
    getWorkWorkerController,
    getWorkWorkersByWorkController,
    getAllWorkWorkersController,
} from "./workWorkerController";

export async function workWorkerRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/work-worker/create", {
        preHandler: [validateSchema(createWorkWorkerSchema), authPreHandler, validatePermission],
        handler: createWorkWorkerController,
    });

    fastify.post("/api/work-worker/update", {
        preHandler: [validateSchema(updateWorkWorkerSchema), authPreHandler, validatePermission],
        handler: updateWorkWorkerController,
    });

    fastify.post("/api/work-worker/delete", {
        preHandler: [validateSchema(deleteWorkWorkerSchema), authPreHandler, validatePermission],
        handler: deleteWorkWorkerController,
    });

    fastify.post("/api/work-worker/get", {
        preHandler: [validateSchema(getWorkWorkerSchema), authPreHandler, validatePermission],
        handler: getWorkWorkerController,
    });

    fastify.post("/api/work-worker/get-by-work", {
        preHandler: [validateSchema(getWorkWorkersByWorkSchema), authPreHandler, validatePermission],
        handler: getWorkWorkersByWorkController,
    });

    fastify.get("/api/work-worker/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getAllWorkWorkersController,
    });
}
