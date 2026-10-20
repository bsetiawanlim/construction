import { FastifyInstance } from "fastify";
import {
    unitSchema,
    getUnitByQuantitySchema,
    convertUnitSchema,
    deleteUnitSchema,
} from "./unitSchema";
import { authPreHandler } from "../personal/auth/authController";
import {
    convertUnit,
    createUnitController,
    deleteUnitController,
    getAllUnitsController,
    getUnitsController,
    updateUnitController,
} from "./unitController";
import { validateSchema } from "../../plugins/zod";
import validatePermission from "../../plugins/permission";
import { paginationQuerySchema } from "../../utils/pagination";

export async function unitRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/unit/create", {
        preHandler: [validateSchema(unitSchema), authPreHandler, validatePermission],
        handler: createUnitController,
    });

    fastify.post("/api/unit/update", {
        preHandler: [validateSchema(unitSchema), authPreHandler, validatePermission],
        handler: updateUnitController,
    });

    fastify.post("/api/unit/delete", {
        preHandler: [validateSchema(deleteUnitSchema), authPreHandler, validatePermission],
        handler: deleteUnitController,
    });

    fastify.get("/api/unit/all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getAllUnitsController,
    });

    fastify.post("/api/unit/get-by-quantity", {
        preHandler: [validateSchema(getUnitByQuantitySchema), authPreHandler, validatePermission],
        handler: getUnitsController,
    });

    fastify.post("/api/unit/convert", {
        preHandler: [validateSchema(convertUnitSchema), authPreHandler, validatePermission],
        handler: convertUnit,
    });
}