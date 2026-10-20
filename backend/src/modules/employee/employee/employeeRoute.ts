import { employeeSchema, deleteEmployeeSchema } from "./employeeSchema";
import { createEmployeeController, getEmployeesController, updateEmployeeController, deleteEmployeeController } from "./employeeController";
import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";

export async function employeeRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/employee/create", {
        preHandler: [authPreHandler, validateSchema(employeeSchema), validatePermission],
        handler: createEmployeeController
    });

    fastify.get("/api/employee/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getEmployeesController
    });

    fastify.post("/api/employee/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getEmployeesController
    });

    fastify.post("/api/employee/update", {
        preHandler: [authPreHandler, validateSchema(employeeSchema), validatePermission],
        handler: updateEmployeeController
    });

    fastify.post("/api/employee/delete", {
        preHandler: [authPreHandler, validateSchema(deleteEmployeeSchema), validatePermission],
        handler: deleteEmployeeController
    });
}
