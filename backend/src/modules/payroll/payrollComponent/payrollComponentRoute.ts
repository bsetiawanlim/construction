import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createPayrollComponentSchema,
    updatePayrollComponentSchema,
    deletePayrollComponentSchema,
    getPayrollComponentSchema,
} from "./payrollComponentSchema";
import {
    createPayrollComponentController,
    updatePayrollComponentController,
    deletePayrollComponentController,
    getPayrollComponentController,
    getPayrollComponentsController,
} from "./payrollComponentController";

export async function payrollComponentRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/payroll-component/create", {
        preHandler: [validateSchema(createPayrollComponentSchema), authPreHandler, validatePermission],
        handler: createPayrollComponentController,
    });

    fastify.post("/api/payroll-component/update", {
        preHandler: [validateSchema(updatePayrollComponentSchema), authPreHandler, validatePermission],
        handler: updatePayrollComponentController,
    });

    fastify.post("/api/payroll-component/delete", {
        preHandler: [validateSchema(deletePayrollComponentSchema), authPreHandler, validatePermission],
        handler: deletePayrollComponentController,
    });

    fastify.post("/api/payroll-component/get", {
        preHandler: [validateSchema(getPayrollComponentSchema), authPreHandler, validatePermission],
        handler: getPayrollComponentController,
    });

    fastify.get("/api/payroll-component/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getPayrollComponentsController,
    });
}
