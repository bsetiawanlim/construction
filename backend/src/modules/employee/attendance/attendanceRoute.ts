import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createAttendanceSchema,
    updateAttendanceSchema,
    deleteAttendanceSchema,
    getAttendanceSchema,
    clockInSchema,
    clockOutSchema,
} from "./attendanceSchema";
import {
    createAttendanceController,
    updateAttendanceController,
    deleteAttendanceController,
    getAttendanceController,
    clockInController,
    clockOutController,
    getAttendancesController,
} from "./attendanceController";

export async function attendanceRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/attendance/create", {
        preHandler: [authPreHandler, validateSchema(createAttendanceSchema), validatePermission],
        handler: createAttendanceController,
    });

    fastify.post("/api/attendance/update", {
        preHandler: [authPreHandler, validateSchema(updateAttendanceSchema), validatePermission],
        handler: updateAttendanceController,
    });

    fastify.post("/api/attendance/delete", {
        preHandler: [authPreHandler, validateSchema(deleteAttendanceSchema), validatePermission],
        handler: deleteAttendanceController,
    });

    fastify.post("/api/attendance/get", {
        preHandler: [authPreHandler, validateSchema(getAttendanceSchema), validatePermission],
        handler: getAttendanceController,
    });

    fastify.post("/api/attendance/clock-in", {
        preHandler: [authPreHandler, validateSchema(clockInSchema), validatePermission],
        handler: clockInController,
    });

    fastify.post("/api/attendance/clock-out", {
        preHandler: [authPreHandler, validateSchema(clockOutSchema), validatePermission],
        handler: clockOutController,
    });

    fastify.get("/api/attendance/get-all", {
        preHandler: [authPreHandler, validatePermission],
        handler: getAttendancesController,
    });
}
