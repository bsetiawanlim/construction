import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createTaskSchema,
    updateTaskSchema,
    deleteTaskSchema,
    getTaskSchema,
    getTasksQuerySchema,
} from "./taskSchema";
import {
    createTaskController,
    updateTaskController,
    deleteTaskController,
    getTaskController,
    getTasksController,
} from "./taskController";

export async function taskRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/task/create", {
        preHandler: [validateSchema(createTaskSchema), authPreHandler, validatePermission],
        handler: createTaskController,
    });

    fastify.post("/api/task/update", {
        preHandler: [validateSchema(updateTaskSchema), authPreHandler, validatePermission],
        handler: updateTaskController,
    });

    fastify.post("/api/task/delete", {
        preHandler: [validateSchema(deleteTaskSchema), authPreHandler, validatePermission],
        handler: deleteTaskController,
    });

    fastify.post("/api/task/get", {
        preHandler: [validateSchema(getTaskSchema), authPreHandler, validatePermission],
        handler: getTaskController,
    });

    fastify.get("/api/task/get-all", {
        preHandler: [validateSchema(getTasksQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getTasksController,
    });
}
