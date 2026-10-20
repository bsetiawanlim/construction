import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createEquipmentTypeSchema,
    updateEquipmentTypeSchema,
    deleteEquipmentTypeSchema,
    getEquipmentTypeSchema,
} from "./equipmentTypeSchema";
import {
    createEquipmentTypeController,
    updateEquipmentTypeController,
    deleteEquipmentTypeController,
    getEquipmentTypeController,
    getAllEquipmentTypesController,
} from "./equipmentTypeController";

export async function equipmentTypeRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/equipment-type/create", {
        preHandler: [authPreHandler, validateSchema(createEquipmentTypeSchema), validatePermission],
        handler: createEquipmentTypeController,
    });

    fastify.post("/api/equipment-type/update", {
        preHandler: [authPreHandler, validateSchema(updateEquipmentTypeSchema), validatePermission],
        handler: updateEquipmentTypeController,
    });

    fastify.post("/api/equipment-type/delete", {
        preHandler: [authPreHandler, validateSchema(deleteEquipmentTypeSchema), validatePermission],
        handler: deleteEquipmentTypeController,
    });

    fastify.post("/api/equipment-type/get", {
        preHandler: [authPreHandler, validateSchema(getEquipmentTypeSchema), validatePermission],
        handler: getEquipmentTypeController,
    });

    fastify.get("/api/equipment-type/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getAllEquipmentTypesController,
    });
}
