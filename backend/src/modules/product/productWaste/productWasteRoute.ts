import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
  createProductWasteSchema,
  getProductWasteSchema,
} from "./productWasteSchema";
import {
  createProductWasteController,
  getProductWasteController,
} from "./productWasteController";

export async function productWasteRoutes(fastify: FastifyInstance, options: any) {
  fastify.post("/api/product/waste/create", {
    preHandler: [validateSchema(createProductWasteSchema), authPreHandler, validatePermission],
    handler: createProductWasteController,
  });

  fastify.post("/api/product/waste/get-all", {
    preHandler: [validateSchema(getProductWasteSchema), authPreHandler, validatePermission],
    handler: getProductWasteController,
  });
}
