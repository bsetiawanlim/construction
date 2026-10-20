import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createEquipmentModelFeatureSchema,
    updateEquipmentModelFeatureSchema,
    deleteEquipmentModelFeatureSchema,
    getEquipmentModelFeatureSchema,
    getEquipmentModelFeaturesByModelSchema,
} from "./equipmentModelFeatureSchema";
import {
    createEquipmentModelFeatureController,
    updateEquipmentModelFeatureController,
    deleteEquipmentModelFeatureController,
    getEquipmentModelFeatureController,
    getEquipmentModelFeaturesByModelController,
} from "./equipmentModelFeatureController";

export async function equipmentModelFeatureRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/equipment-model-feature/create", {
        preHandler: [authPreHandler, validateSchema(createEquipmentModelFeatureSchema), validatePermission],
        handler: createEquipmentModelFeatureController,
    });

    fastify.post("/api/equipment-model-feature/update", {
        preHandler: [authPreHandler, validateSchema(updateEquipmentModelFeatureSchema), validatePermission],
        handler: updateEquipmentModelFeatureController,
    });

    fastify.post("/api/equipment-model-feature/delete", {
        preHandler: [authPreHandler, validateSchema(deleteEquipmentModelFeatureSchema), validatePermission],
        handler: deleteEquipmentModelFeatureController,
    });

    fastify.post("/api/equipment-model-feature/get", {
        preHandler: [authPreHandler, validateSchema(getEquipmentModelFeatureSchema), validatePermission],
        handler: getEquipmentModelFeatureController,
    });

    fastify.post("/api/equipment-model-feature/get-by-model", {
        preHandler: [authPreHandler, validateSchema(getEquipmentModelFeaturesByModelSchema), validatePermission],
        handler: getEquipmentModelFeaturesByModelController,
    });
}
