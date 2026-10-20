import { customerSchema, deleteCustomerSchema, restoreCustomerSchema } from "./customerSchema";
import { createCustomerController, getCustomersController, updateCustomerController, deleteCustomerController, restoreCustomerController } from "./customerController";
import { FastifyInstance } from "fastify";
import { authPreHandler } from "../auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";


export async function customerRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/customer/create", {
        preHandler: [authPreHandler, validateSchema(customerSchema), validatePermission],
        handler: createCustomerController
    });

    fastify.get("/api/customer/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getCustomersController
    });

    fastify.post("/api/customer/update", {
        preHandler: [authPreHandler, validateSchema(customerSchema), validatePermission],
        handler: updateCustomerController
    });

    fastify.post("/api/customer/delete", {
        preHandler: [authPreHandler, validateSchema(deleteCustomerSchema), validatePermission],
        handler: deleteCustomerController
    });

    fastify.post("/api/customer/restore", {
        preHandler: [authPreHandler, validateSchema(restoreCustomerSchema), validatePermission],
        handler: restoreCustomerController
    });
};