import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createEquipmentPriceSchema,
    updateEquipmentPriceSchema,
    deleteEquipmentPriceSchema,
    getEquipmentPriceSchema,
    getEquipmentPricesByEntitySchema,
} from "./equipmentPriceSchema";
import {
    createEquipmentPriceController,
    updateEquipmentPriceController,
    deleteEquipmentPriceController,
    getEquipmentPriceController,
    getEquipmentPricesByEntityController,
} from "./equipmentPriceController";

export async function equipmentPriceRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/equipment-price/create", {
        preHandler: [authPreHandler, validateSchema(createEquipmentPriceSchema), validatePermission],
        handler: createEquipmentPriceController,
    });

    fastify.post("/api/equipment-price/update", {
        preHandler: [authPreHandler, validateSchema(updateEquipmentPriceSchema), validatePermission],
        handler: updateEquipmentPriceController,
    });

    fastify.post("/api/equipment-price/delete", {
        preHandler: [authPreHandler, validateSchema(deleteEquipmentPriceSchema), validatePermission],
        handler: deleteEquipmentPriceController,
    });

    fastify.post("/api/equipment-price/get", {
        preHandler: [authPreHandler, validateSchema(getEquipmentPriceSchema), validatePermission],
        handler: getEquipmentPriceController,
    });

    fastify.post("/api/equipment-price/by-equipment", {
        preHandler: [authPreHandler, validateSchema(getEquipmentPricesByEntitySchema), validatePermission],
        handler: getEquipmentPricesByEntityController,
    });
}
