import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
  createScheduleSchema,
  updateScheduleSchema,
  deleteScheduleSchema,
} from "./scheduleSchema";
import {
  createScheduleController,
  updateScheduleController,
  deleteScheduleController,
  getSchedulesController,
} from "./scheduleController";

export async function scheduleRoutes(fastify: FastifyInstance) {
  fastify.get("/api/schedule/get-all", {
    preHandler: [authPreHandler, validatePermission],
    handler: getSchedulesController,
  });

  fastify.post("/api/schedule/create", {
    preHandler: [validateSchema(createScheduleSchema), authPreHandler, validatePermission],
    handler: createScheduleController,
  });

  fastify.post("/api/schedule/update", {
    preHandler: [validateSchema(updateScheduleSchema), authPreHandler, validatePermission],
    handler: updateScheduleController,
  });

  fastify.post("/api/schedule/delete", {
    preHandler: [validateSchema(deleteScheduleSchema), authPreHandler, validatePermission],
    handler: deleteScheduleController,
  });
}
