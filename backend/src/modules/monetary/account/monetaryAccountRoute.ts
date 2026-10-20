import { FastifyInstance } from "fastify";
import {
    createMonetaryAccountController,
    getMonetaryAccountControllerByProfile,
    getMonetaryAccountByIdController,
    getMonetaryAccountController,
    updateMonetaryAccountController,
    deleteMonetaryAccountController,
} from "./monetaryAccountController";
import {
    monetaryAccountSchema,
    getByProfileSchema,
    deleteMonetaryAccountSchema,
} from "./monetaryAccountSchema";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";

export async function monetaryAccountRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/monetaryAccount/create", {
        preHandler: [validateSchema(monetaryAccountSchema), authPreHandler, validatePermission],
        handler: createMonetaryAccountController,
    });

    fastify.put("/api/monetaryAccount/update", {
        preHandler: [validateSchema(monetaryAccountSchema), authPreHandler, validatePermission],
        handler: updateMonetaryAccountController,
    });

    fastify.post("/api/monetaryAccount/delete", {
        preHandler: [validateSchema(deleteMonetaryAccountSchema), authPreHandler, validatePermission],
        handler: deleteMonetaryAccountController,
    });

    fastify.get("/api/monetaryAccount", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getMonetaryAccountController,
    });

    fastify.post("/api/monetaryAccount/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getMonetaryAccountController,
    });

    fastify.get("/api/monetaryAccount/:id", {
        preHandler: [authPreHandler, validatePermission],
        handler: getMonetaryAccountByIdController,
    });

    fastify.post("/api/monetaryAccount/get-by-profile", {
        preHandler: [validateSchema(getByProfileSchema), authPreHandler, validatePermission],
        handler: getMonetaryAccountControllerByProfile,
    });
}