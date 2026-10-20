import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createWorkItemSchema,
    updateWorkItemSchema,
    deleteWorkItemSchema,
    getWorkItemSchema,
    getWorkItemsByWorkSchema,
} from "./workItemSchema";
import {
    createWorkItemController,
    updateWorkItemController,
    deleteWorkItemController,
    getWorkItemController,
    getWorkItemsByWorkController,
} from "./workItemController";

export async function workItemRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/work-item/create", {
        preHandler: [validateSchema(createWorkItemSchema), authPreHandler, validatePermission],
        handler: createWorkItemController,
    });

    fastify.post("/api/work-item/update", {
        preHandler: [validateSchema(updateWorkItemSchema), authPreHandler, validatePermission],
        handler: updateWorkItemController,
    });

    fastify.post("/api/work-item/delete", {
        preHandler: [validateSchema(deleteWorkItemSchema), authPreHandler, validatePermission],
        handler: deleteWorkItemController,
    });

    fastify.post("/api/work-item/get", {
        preHandler: [validateSchema(getWorkItemSchema), authPreHandler, validatePermission],
        handler: getWorkItemController,
    });

    fastify.post("/api/work-item/get-by-work", {
        preHandler: [validateSchema(getWorkItemsByWorkSchema), authPreHandler, validatePermission],
        handler: getWorkItemsByWorkController,
    });
}
