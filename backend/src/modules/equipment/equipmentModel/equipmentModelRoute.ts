import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createEquipmentModelSchema,
    updateEquipmentModelSchema,
    deleteEquipmentModelSchema,
    getEquipmentModelSchema,
    getEquipmentModelsByTypeSchema,
} from "./equipmentModelSchema";
import {
    createEquipmentModelController,
    updateEquipmentModelController,
    deleteEquipmentModelController,
    getEquipmentModelController,
    getEquipmentModelsByTypeController,
    getAllEquipmentModelsController,
} from "./equipmentModelController";

export async function equipmentModelRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/equipment-model/create", {
        preHandler: [authPreHandler, validateSchema(createEquipmentModelSchema), validatePermission],
        handler: createEquipmentModelController,
    });

    fastify.post("/api/equipment-model/update", {
        preHandler: [authPreHandler, validateSchema(updateEquipmentModelSchema), validatePermission],
        handler: updateEquipmentModelController,
    });

    fastify.post("/api/equipment-model/delete", {
        preHandler: [authPreHandler, validateSchema(deleteEquipmentModelSchema), validatePermission],
        handler: deleteEquipmentModelController,
    });

    fastify.post("/api/equipment-model/get", {
        preHandler: [authPreHandler, validateSchema(getEquipmentModelSchema), validatePermission],
        handler: getEquipmentModelController,
    });

    fastify.post("/api/equipment-model/get-by-type", {
        preHandler: [authPreHandler, validateSchema(getEquipmentModelsByTypeSchema), validatePermission],
        handler: getEquipmentModelsByTypeController,
    });

    fastify.get("/api/equipment-model/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getAllEquipmentModelsController,
    });
}
