import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createDriverSchema,
    updateDriverSchema,
    deleteDriverSchema,
    getDriverSchema,
} from "./driverSchema";
import {
    createDriverController,
    updateDriverController,
    deleteDriverController,
    getDriverController,
    getDriversController,
} from "./driverController";

export async function driverRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/driver/create", {
        preHandler: [validateSchema(createDriverSchema), authPreHandler, validatePermission],
        handler: createDriverController,
    });

    fastify.post("/api/driver/update", {
        preHandler: [validateSchema(updateDriverSchema), authPreHandler, validatePermission],
        handler: updateDriverController,
    });

    fastify.post("/api/driver/delete", {
        preHandler: [validateSchema(deleteDriverSchema), authPreHandler, validatePermission],
        handler: deleteDriverController,
    });

    fastify.post("/api/driver/get", {
        preHandler: [validateSchema(getDriverSchema), authPreHandler, validatePermission],
        handler: getDriverController,
    });

    fastify.get("/api/driver/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getDriversController,
    });
}
