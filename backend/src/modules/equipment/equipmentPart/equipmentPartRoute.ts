import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createEquipmentPartSchema,
    updateEquipmentPartSchema,
    deleteEquipmentPartSchema,
    getEquipmentPartSchema,
    getEquipmentPartsByModelSchema,
} from "./equipmentPartSchema";
import {
    createEquipmentPartController,
    updateEquipmentPartController,
    deleteEquipmentPartController,
    getEquipmentPartController,
    getEquipmentPartsByModelController,
    getAllEquipmentPartsController,
} from "./equipmentPartController";

export async function equipmentPartRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/equipment-part/create", {
        preHandler: [authPreHandler, validateSchema(createEquipmentPartSchema), validatePermission],
        handler: createEquipmentPartController,
    });

    fastify.post("/api/equipment-part/update", {
        preHandler: [authPreHandler, validateSchema(updateEquipmentPartSchema), validatePermission],
        handler: updateEquipmentPartController,
    });

    fastify.post("/api/equipment-part/delete", {
        preHandler: [authPreHandler, validateSchema(deleteEquipmentPartSchema), validatePermission],
        handler: deleteEquipmentPartController,
    });

    fastify.post("/api/equipment-part/get", {
        preHandler: [authPreHandler, validateSchema(getEquipmentPartSchema), validatePermission],
        handler: getEquipmentPartController,
    });

    fastify.post("/api/equipment-part/get-by-model", {
        preHandler: [authPreHandler, validateSchema(getEquipmentPartsByModelSchema), validatePermission],
        handler: getEquipmentPartsByModelController,
    });

    fastify.get("/api/equipment-part/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getAllEquipmentPartsController,
    });
}
