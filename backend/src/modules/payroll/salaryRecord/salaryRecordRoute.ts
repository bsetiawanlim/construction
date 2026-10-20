import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    generateSalaryRecordSchema,
    updateSalaryRecordSchema,
    deleteSalaryRecordSchema,
    getSalaryRecordSchema,
    getSalaryRecordsByPeriodSchema,
} from "./salaryRecordSchema";
import {
    generateSalaryRecordController,
    updateSalaryRecordController,
    deleteSalaryRecordController,
    getSalaryRecordController,
    getSalaryRecordsByPeriodController,
    getAllSalaryRecordsController,
} from "./salaryRecordController";

export async function salaryRecordRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/salary-record/generate", {
        preHandler: [validateSchema(generateSalaryRecordSchema), authPreHandler, validatePermission],
        handler: generateSalaryRecordController,
    });

    fastify.post("/api/salary-record/update", {
        preHandler: [validateSchema(updateSalaryRecordSchema), authPreHandler, validatePermission],
        handler: updateSalaryRecordController,
    });

    fastify.post("/api/salary-record/delete", {
        preHandler: [validateSchema(deleteSalaryRecordSchema), authPreHandler, validatePermission],
        handler: deleteSalaryRecordController,
    });

    fastify.post("/api/salary-record/get", {
        preHandler: [validateSchema(getSalaryRecordSchema), authPreHandler, validatePermission],
        handler: getSalaryRecordController,
    });

    fastify.post("/api/salary-record/get-by-period", {
        preHandler: [validateSchema(getSalaryRecordsByPeriodSchema), authPreHandler, validatePermission],
        handler: getSalaryRecordsByPeriodController,
    });

    fastify.get("/api/salary-record/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getAllSalaryRecordsController,
    });
}
