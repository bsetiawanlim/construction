import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createEquipmentMaintenanceSchema,
    updateEquipmentMaintenanceSchema,
    deleteEquipmentMaintenanceSchema,
    getEquipmentMaintenanceSchema,
    getEquipmentMaintenanceByEntitySchema,
} from "./equipmentMaintenanceSchema";
import {
    createEquipmentMaintenanceController,
    updateEquipmentMaintenanceController,
    deleteEquipmentMaintenanceController,
    getEquipmentMaintenanceController,
    getEquipmentMaintenanceByEntityController,
} from "./equipmentMaintenanceController";

export async function equipmentMaintenanceRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/equipment-maintenance/create", {
        preHandler: [authPreHandler, validateSchema(createEquipmentMaintenanceSchema), validatePermission],
        handler: createEquipmentMaintenanceController,
    });

    fastify.post("/api/equipment-maintenance/update", {
        preHandler: [authPreHandler, validateSchema(updateEquipmentMaintenanceSchema), validatePermission],
        handler: updateEquipmentMaintenanceController,
    });

    fastify.post("/api/equipment-maintenance/delete", {
        preHandler: [authPreHandler, validateSchema(deleteEquipmentMaintenanceSchema), validatePermission],
        handler: deleteEquipmentMaintenanceController,
    });

    fastify.post("/api/equipment-maintenance/get", {
        preHandler: [authPreHandler, validateSchema(getEquipmentMaintenanceSchema), validatePermission],
        handler: getEquipmentMaintenanceController,
    });

    fastify.post("/api/equipment-maintenance/get-by-entity", {
        preHandler: [authPreHandler, validateSchema(getEquipmentMaintenanceByEntitySchema), validatePermission],
        handler: getEquipmentMaintenanceByEntityController,
    });
}
