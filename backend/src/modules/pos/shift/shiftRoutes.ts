import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { openShiftSchema, closeShiftSchema } from "./shiftSchema";
import {
  openShiftController,
  closeShiftController,
  getCurrentShiftController,
  listShiftsController,
} from "./shiftController";

export async function shiftRoutes(fastify: FastifyInstance) {
  fastify.post("/api/shift/open", {
    preHandler: [validateSchema(openShiftSchema), authPreHandler],
    handler: openShiftController,
  });

  fastify.post("/api/shift/close", {
    preHandler: [validateSchema(closeShiftSchema), authPreHandler],
    handler: closeShiftController,
  });

  fastify.get("/api/shift/current", {
    preHandler: [authPreHandler],
    handler: getCurrentShiftController,
  });

  fastify.get("/api/shift/get-all", {
    preHandler: [authPreHandler, validatePermission],
    handler: listShiftsController,
  });
}
