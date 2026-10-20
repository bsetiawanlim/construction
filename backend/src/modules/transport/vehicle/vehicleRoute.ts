import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createVehicleSchema,
    updateVehicleSchema,
    deleteVehicleSchema,
    getVehicleSchema,
} from "./vehicleSchema";
import {
    createVehicleController,
    updateVehicleController,
    deleteVehicleController,
    getVehicleController,
    getVehiclesController,
} from "./vehicleController";

export async function vehicleRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/vehicle/create", {
        preHandler: [validateSchema(createVehicleSchema), authPreHandler, validatePermission],
        handler: createVehicleController,
    });

    fastify.post("/api/vehicle/update", {
        preHandler: [validateSchema(updateVehicleSchema), authPreHandler, validatePermission],
        handler: updateVehicleController,
    });

    fastify.post("/api/vehicle/delete", {
        preHandler: [validateSchema(deleteVehicleSchema), authPreHandler, validatePermission],
        handler: deleteVehicleController,
    });

    fastify.post("/api/vehicle/get", {
        preHandler: [validateSchema(getVehicleSchema), authPreHandler, validatePermission],
        handler: getVehicleController,
    });

    fastify.get("/api/vehicle/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getVehiclesController,
    });
}
