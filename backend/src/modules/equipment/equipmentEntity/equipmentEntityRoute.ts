import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createEquipmentEntitySchema,
    updateEquipmentEntitySchema,
    deleteEquipmentEntitySchema,
    getEquipmentEntitySchema,
    getEquipmentDepreciationSchema,
} from "./equipmentEntitySchema";
import {
    createEquipmentEntityController,
    updateEquipmentEntityController,
    deleteEquipmentEntityController,
    getEquipmentEntityController,
    getEquipmentDepreciationController,
    getAllEquipmentEntitiesController,
} from "./equipmentEntityController";

export async function equipmentEntityRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/equipment/create", {
        preHandler: [authPreHandler, validateSchema(createEquipmentEntitySchema), validatePermission],
        handler: createEquipmentEntityController,
    });

    fastify.post("/api/equipment/update", {
        preHandler: [authPreHandler, validateSchema(updateEquipmentEntitySchema), validatePermission],
        handler: updateEquipmentEntityController,
    });

    fastify.post("/api/equipment/delete", {
        preHandler: [authPreHandler, validateSchema(deleteEquipmentEntitySchema), validatePermission],
        handler: deleteEquipmentEntityController,
    });

    fastify.post("/api/equipment/get", {
        preHandler: [authPreHandler, validateSchema(getEquipmentEntitySchema), validatePermission],
        handler: getEquipmentEntityController,
    });

    fastify.post("/api/equipment/depreciation", {
        preHandler: [authPreHandler, validateSchema(getEquipmentDepreciationSchema), validatePermission],
        handler: getEquipmentDepreciationController,
    });

    fastify.get("/api/equipment/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getAllEquipmentEntitiesController,
    });
}
