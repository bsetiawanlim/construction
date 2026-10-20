import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createWorkEquipmentSchema,
    updateWorkEquipmentSchema,
    deleteWorkEquipmentSchema,
    getWorkEquipmentSchema,
    getWorkEquipmentsByWorkSchema,
} from "./workEquipmentSchema";
import {
    createWorkEquipmentController,
    updateWorkEquipmentController,
    deleteWorkEquipmentController,
    getWorkEquipmentController,
    getWorkEquipmentsByWorkController,
    getAllWorkEquipmentsController,
} from "./workEquipmentController";

export async function workEquipmentRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/work-equipment/create", {
        preHandler: [validateSchema(createWorkEquipmentSchema), authPreHandler, validatePermission],
        handler: createWorkEquipmentController,
    });

    fastify.post("/api/work-equipment/update", {
        preHandler: [validateSchema(updateWorkEquipmentSchema), authPreHandler, validatePermission],
        handler: updateWorkEquipmentController,
    });

    fastify.post("/api/work-equipment/delete", {
        preHandler: [validateSchema(deleteWorkEquipmentSchema), authPreHandler, validatePermission],
        handler: deleteWorkEquipmentController,
    });

    fastify.post("/api/work-equipment/get", {
        preHandler: [validateSchema(getWorkEquipmentSchema), authPreHandler, validatePermission],
        handler: getWorkEquipmentController,
    });

    fastify.post("/api/work-equipment/get-by-work", {
        preHandler: [validateSchema(getWorkEquipmentsByWorkSchema), authPreHandler, validatePermission],
        handler: getWorkEquipmentsByWorkController,
    });

    fastify.get("/api/work-equipment/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getAllWorkEquipmentsController,
    });
}
