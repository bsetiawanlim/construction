import { FastifyInstance } from "fastify";
import { createUserSchema, updateUserSchema, deleteUserSchema, toggleUserStatusSchema } from "./userSchema";
import { authPreHandler } from "../auth/authController";
import {
    getUsersController,
    createUserController,
    updateUserController,
    toggleUserStatusController,
    deleteUserController,
    checkUserDeleteController
} from "./userController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";

export async function userRoutes(fastify: FastifyInstance, options: any) {
    fastify.get("/api/user/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getUsersController
    });

    fastify.post("/api/user/create", {
        preHandler: [validateSchema(createUserSchema), authPreHandler, validatePermission],
        handler: createUserController
    });

    fastify.post("/api/user/update", {
        preHandler: [validateSchema(updateUserSchema), authPreHandler, validatePermission],
        handler: updateUserController
    });

    fastify.post("/api/user/toggle-status", {
        preHandler: [validateSchema(toggleUserStatusSchema), authPreHandler, validatePermission],
        handler: toggleUserStatusController
    });

    fastify.post("/api/user/delete", {
        preHandler: [validateSchema(deleteUserSchema), authPreHandler, validatePermission],
        handler: deleteUserController
    });

    fastify.post("/api/user/check-delete", {
        preHandler: [validateSchema(deleteUserSchema), authPreHandler, validatePermission],
        handler: checkUserDeleteController
    });
}
