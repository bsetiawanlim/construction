import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createPayrollPeriodSchema,
    updatePayrollPeriodSchema,
    deletePayrollPeriodSchema,
    getPayrollPeriodSchema,
} from "./payrollPeriodSchema";
import {
    createPayrollPeriodController,
    updatePayrollPeriodController,
    deletePayrollPeriodController,
    getPayrollPeriodController,
    getPayrollPeriodsController,
} from "./payrollPeriodController";

export async function payrollPeriodRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/payroll-period/create", {
        preHandler: [validateSchema(createPayrollPeriodSchema), authPreHandler, validatePermission],
        handler: createPayrollPeriodController,
    });

    fastify.post("/api/payroll-period/update", {
        preHandler: [validateSchema(updatePayrollPeriodSchema), authPreHandler, validatePermission],
        handler: updatePayrollPeriodController,
    });

    fastify.post("/api/payroll-period/delete", {
        preHandler: [validateSchema(deletePayrollPeriodSchema), authPreHandler, validatePermission],
        handler: deletePayrollPeriodController,
    });

    fastify.post("/api/payroll-period/get", {
        preHandler: [validateSchema(getPayrollPeriodSchema), authPreHandler, validatePermission],
        handler: getPayrollPeriodController,
    });

    fastify.get("/api/payroll-period/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getPayrollPeriodsController,
    });
}
