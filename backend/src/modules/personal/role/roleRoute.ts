import { FastifyInstance } from "fastify";
import { createRoleSchema, deleteRoleSchema, updateRoleSchema, getRoleSchema } from "./roleSchema";
import { authPreHandler } from "../auth/authController";
import { createRoleController, deleteRoleController, getRolesController, updateRoleController, getRoleByIdController } from "./roleController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";

export async function roleRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/role/create", {
        preHandler: [validateSchema(createRoleSchema), authPreHandler, validatePermission],
        handler: createRoleController
    });

    fastify.get("/api/role/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getRolesController
    });

    fastify.post("/api/role/get-id", {
        preHandler: [validateSchema(getRoleSchema), authPreHandler],
        handler: getRoleByIdController
    });

    fastify.get("/api/role/get-id", {
        preHandler: [authPreHandler],
        handler: getRoleByIdController
    });

    fastify.post("/api/role/get", {
        preHandler: [validateSchema(getRoleSchema), authPreHandler],
        handler: getRoleByIdController
    });

    fastify.get("/api/role/get", {
        preHandler: [authPreHandler],
        handler: getRoleByIdController
    });

    fastify.post("/api/role/delete", {
        preHandler: [validateSchema(deleteRoleSchema), authPreHandler, validatePermission],
        handler: deleteRoleController
    });

    fastify.post("/api/role/update", {
        preHandler: [validateSchema(updateRoleSchema), authPreHandler, validatePermission],
        handler: updateRoleController
    });

};