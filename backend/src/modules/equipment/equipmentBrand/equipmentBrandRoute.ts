import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createEquipmentBrandSchema,
    updateEquipmentBrandSchema,
    deleteEquipmentBrandSchema,
    getEquipmentBrandSchema,
} from "./equipmentBrandSchema";
import {
    createEquipmentBrandController,
    updateEquipmentBrandController,
    deleteEquipmentBrandController,
    getEquipmentBrandController,
    getAllEquipmentBrandsController,
} from "./equipmentBrandController";

export async function equipmentBrandRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/equipment-brand/create", {
        preHandler: [authPreHandler, validateSchema(createEquipmentBrandSchema), validatePermission],
        handler: createEquipmentBrandController,
    });

    fastify.post("/api/equipment-brand/update", {
        preHandler: [authPreHandler, validateSchema(updateEquipmentBrandSchema), validatePermission],
        handler: updateEquipmentBrandController,
    });

    fastify.post("/api/equipment-brand/delete", {
        preHandler: [authPreHandler, validateSchema(deleteEquipmentBrandSchema), validatePermission],
        handler: deleteEquipmentBrandController,
    });

    fastify.post("/api/equipment-brand/get", {
        preHandler: [authPreHandler, validateSchema(getEquipmentBrandSchema), validatePermission],
        handler: getEquipmentBrandController,
    });

    fastify.get("/api/equipment-brand/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getAllEquipmentBrandsController,
    });
}
