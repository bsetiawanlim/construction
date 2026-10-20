import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createTripSchema,
    updateTripSchema,
    deleteTripSchema,
    getTripSchema,
    getTripsQuerySchema,
} from "./tripSchema";
import {
    createTripController,
    updateTripController,
    deleteTripController,
    getTripController,
    getTripsController,
} from "./tripController";

export async function tripRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/trip/create", {
        preHandler: [validateSchema(createTripSchema), authPreHandler, validatePermission],
        handler: createTripController,
    });

    fastify.post("/api/trip/update", {
        preHandler: [validateSchema(updateTripSchema), authPreHandler, validatePermission],
        handler: updateTripController,
    });

    fastify.post("/api/trip/delete", {
        preHandler: [validateSchema(deleteTripSchema), authPreHandler, validatePermission],
        handler: deleteTripController,
    });

    fastify.post("/api/trip/get", {
        preHandler: [validateSchema(getTripSchema), authPreHandler, validatePermission],
        handler: getTripController,
    });

    fastify.get("/api/trip/get-all", {
        preHandler: [validateSchema(getTripsQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getTripsController,
    });
}
