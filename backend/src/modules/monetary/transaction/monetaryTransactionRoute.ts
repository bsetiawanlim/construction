import {
    createMonetaryTransactionController,
    updateMonetaryTransactionController,
    deleteMonetaryTransactionController,
    getMonetaryTransactionsController,
    getMonetaryTransactionsByAccountController,
} from "./monetaryTransactionController";
import { FastifyInstance } from "fastify";
import {
    monetaryTransactionSchema,
    updateMonetaryTransactionSchema,
    deleteMonetaryTransactionSchema,
    getMonetaryTransactionsByAccountSchema,
} from "./monetaryTransactionSchema";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";

export async function monetaryTransactionRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/monetaryTransaction/create", {
        preHandler: [validateSchema(monetaryTransactionSchema), authPreHandler, validatePermission],
        handler: createMonetaryTransactionController,
    });

    fastify.post("/api/monetaryTransaction/update", {
        preHandler: [validateSchema(updateMonetaryTransactionSchema), authPreHandler, validatePermission],
        handler: updateMonetaryTransactionController,
    });

    fastify.post("/api/monetaryTransaction/delete", {
        preHandler: [validateSchema(deleteMonetaryTransactionSchema), authPreHandler, validatePermission],
        handler: deleteMonetaryTransactionController,
    });

    fastify.get("/api/monetaryTransaction/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getMonetaryTransactionsController,
    });

    fastify.post("/api/monetaryTransaction/get-by-account", {
        preHandler: [validateSchema(getMonetaryTransactionsByAccountSchema), authPreHandler, validatePermission],
        handler: getMonetaryTransactionsByAccountController,
    });
}
