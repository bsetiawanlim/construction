import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createWorkerSchema,
    updateWorkerSchema,
    deleteWorkerSchema,
    getWorkerSchema,
} from "./workerSchema";
import {
    addWorkerController,
    updateWorkerController,
    deleteWorkerController,
    getWorkerController,
    getAllWorkersController,
} from "./workerController";

export async function workerRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/worker/create", {
        preHandler: [validateSchema(createWorkerSchema), authPreHandler, validatePermission],
        handler: addWorkerController,
    });

    fastify.post("/api/worker/update", {
        preHandler: [validateSchema(updateWorkerSchema), authPreHandler, validatePermission],
        handler: updateWorkerController,
    });

    fastify.post("/api/worker/delete", {
        preHandler: [validateSchema(deleteWorkerSchema), authPreHandler, validatePermission],
        handler: deleteWorkerController,
    });

    fastify.post("/api/worker/get", {
        preHandler: [validateSchema(getWorkerSchema), authPreHandler, validatePermission],
        handler: getWorkerController,
    });

    fastify.get("/api/worker/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getAllWorkersController,
    });
}