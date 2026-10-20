import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createWorkSchema,
    updateWorkSchema,
    deleteWorkSchema,
    getWorkSchema,
} from "./workSchema";
import {
    createWorkController,
    updateWorkController,
    deleteWorkController,
    getWorkController,
    getWorksController,
} from "./workController";

export async function workRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/work/create", {
        preHandler: [validateSchema(createWorkSchema), authPreHandler, validatePermission],
        handler: createWorkController,
    });

    fastify.post("/api/work/update", {
        preHandler: [validateSchema(updateWorkSchema), authPreHandler, validatePermission],
        handler: updateWorkController,
    });

    fastify.post("/api/work/delete", {
        preHandler: [validateSchema(deleteWorkSchema), authPreHandler, validatePermission],
        handler: deleteWorkController,
    });

    fastify.post("/api/work/get", {
        preHandler: [validateSchema(getWorkSchema), authPreHandler, validatePermission],
        handler: getWorkController,
    });

    fastify.get("/api/work/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getWorksController,
    });
}
