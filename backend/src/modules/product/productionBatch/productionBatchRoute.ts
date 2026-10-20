import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
  createProductionBatchSchema,
  confirmProductionBatchSchema,
  cancelProductionBatchSchema,
  getProductionBatchQuerySchema,
  previewProductionBatchSchema,
} from "./productionBatchSchema";
import {
  createProductionBatchController,
  confirmProductionBatchController,
  cancelProductionBatchController,
  getProductionBatchesController,
  previewProductionBatchController,
} from "./productionBatchController";

export async function productionBatchRoutes(fastify: FastifyInstance, options: any) {
  fastify.post("/api/production-batch/preview", {
    preHandler: [validateSchema(previewProductionBatchSchema), authPreHandler, validatePermission],
    handler: previewProductionBatchController,
  });

  fastify.post("/api/production-batch/create", {
    preHandler: [validateSchema(createProductionBatchSchema), authPreHandler, validatePermission],
    handler: createProductionBatchController,
  });

  fastify.post("/api/production-batch/confirm-complete", {
    preHandler: [validateSchema(confirmProductionBatchSchema), authPreHandler, validatePermission],
    handler: confirmProductionBatchController,
  });

  fastify.post("/api/production-batch/cancel", {
    preHandler: [validateSchema(cancelProductionBatchSchema), authPreHandler, validatePermission],
    handler: cancelProductionBatchController,
  });

  fastify.post("/api/production-batch/get-all", {
    preHandler: [validateSchema(getProductionBatchQuerySchema), authPreHandler, validatePermission],
    handler: getProductionBatchesController,
  });
}
