import { vendorSchema, deletevendorSchema, restorevendorSchema } from "./vendorSchema";
import { createVendorController, deleteVendorController, updateVendorController, getVendorsController, restoreVendorController } from "./vendorController";
import { FastifyInstance } from "fastify";
import { authPreHandler } from "../auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";


export async function vendorRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/vendor/create", {
        preHandler: [authPreHandler, validateSchema(vendorSchema), validatePermission],
        handler: createVendorController
    });
    fastify.post("/api/vendor/delete", {
        preHandler: [authPreHandler, validateSchema(deletevendorSchema), validatePermission],
        handler: deleteVendorController
    });
    fastify.post("/api/vendor/update", {
        preHandler: [authPreHandler, validateSchema(vendorSchema), validatePermission],
        handler: updateVendorController
    });
    fastify.get("/api/vendor/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getVendorsController
    });
    fastify.post("/api/vendor/restore", {
        preHandler: [authPreHandler, validateSchema(restorevendorSchema), validatePermission],
        handler: restoreVendorController
    });
};