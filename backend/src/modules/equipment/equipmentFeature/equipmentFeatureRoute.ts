import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createEquipmentFeatureSchema,
    updateEquipmentFeatureSchema,
    deleteEquipmentFeatureSchema,
    getEquipmentFeatureSchema,
    getEquipmentFeaturesByEntitySchema,
} from "./equipmentFeatureSchema";
import {
    createEquipmentFeatureController,
    updateEquipmentFeatureController,
    deleteEquipmentFeatureController,
    getEquipmentFeatureController,
    getEquipmentFeaturesByEntityController,
} from "./equipmentFeatureController";

export async function equipmentFeatureRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/equipment-feature/create", {
        preHandler: [authPreHandler, validateSchema(createEquipmentFeatureSchema), validatePermission],
        handler: createEquipmentFeatureController,
    });

    fastify.post("/api/equipment-feature/update", {
        preHandler: [authPreHandler, validateSchema(updateEquipmentFeatureSchema), validatePermission],
        handler: updateEquipmentFeatureController,
    });

    fastify.post("/api/equipment-feature/delete", {
        preHandler: [authPreHandler, validateSchema(deleteEquipmentFeatureSchema), validatePermission],
        handler: deleteEquipmentFeatureController,
    });

    fastify.post("/api/equipment-feature/get", {
        preHandler: [authPreHandler, validateSchema(getEquipmentFeatureSchema), validatePermission],
        handler: getEquipmentFeatureController,
    });

    fastify.post("/api/equipment-feature/get-by-entity", {
        preHandler: [authPreHandler, validateSchema(getEquipmentFeaturesByEntitySchema), validatePermission],
        handler: getEquipmentFeaturesByEntityController,
    });
}
