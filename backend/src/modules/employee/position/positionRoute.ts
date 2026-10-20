import { positionSchema, deletePositionSchema } from "./positionSchema";
import { createPositionController, getPositionsController, updatePositionController, deletePositionController } from "./positionController";
import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";

export async function positionRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/position/create", {
        preHandler: [authPreHandler, validateSchema(positionSchema), validatePermission],
        handler: createPositionController
    });

    fastify.get("/api/position/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getPositionsController
    });

    fastify.post("/api/position/update", {
        preHandler: [authPreHandler, validateSchema(positionSchema), validatePermission],
        handler: updatePositionController
    });

    fastify.post("/api/position/delete", {
        preHandler: [authPreHandler, validateSchema(deletePositionSchema), validatePermission],
        handler: deletePositionController
    });
}
