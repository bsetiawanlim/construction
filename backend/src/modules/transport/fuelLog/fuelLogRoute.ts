import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createFuelLogSchema,
    updateFuelLogSchema,
    deleteFuelLogSchema,
    getFuelLogSchema,
    getFuelLogsQuerySchema,
} from "./fuelLogSchema";
import {
    createFuelLogController,
    updateFuelLogController,
    deleteFuelLogController,
    getFuelLogController,
    getFuelLogsController,
} from "./fuelLogController";

export async function fuelLogRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/fuel-log/create", {
        preHandler: [validateSchema(createFuelLogSchema), authPreHandler, validatePermission],
        handler: createFuelLogController,
    });

    fastify.post("/api/fuel-log/update", {
        preHandler: [validateSchema(updateFuelLogSchema), authPreHandler, validatePermission],
        handler: updateFuelLogController,
    });

    fastify.post("/api/fuel-log/delete", {
        preHandler: [validateSchema(deleteFuelLogSchema), authPreHandler, validatePermission],
        handler: deleteFuelLogController,
    });

    fastify.post("/api/fuel-log/get", {
        preHandler: [validateSchema(getFuelLogSchema), authPreHandler, validatePermission],
        handler: getFuelLogController,
    });

    fastify.get("/api/fuel-log/get-all", {
        preHandler: [validateSchema(getFuelLogsQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getFuelLogsController,
    });
}
