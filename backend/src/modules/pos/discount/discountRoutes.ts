import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
  createDiscountSchema,
  updateDiscountSchema,
  deleteDiscountSchema,
  validateDiscountSchema,
} from "./discountSchema";
import {
  listDiscountsController,
  createDiscountController,
  updateDiscountController,
  deleteDiscountController,
  validateDiscountController,
} from "./discountController";

export async function discountRoutes(fastify: FastifyInstance) {
  fastify.get("/api/discount/get-all", {
    preHandler: [authPreHandler, validatePermission],
    handler: listDiscountsController,
  });

  fastify.post("/api/discount/create", {
    preHandler: [validateSchema(createDiscountSchema), authPreHandler, validatePermission],
    handler: createDiscountController,
  });

  fastify.post("/api/discount/update", {
    preHandler: [validateSchema(updateDiscountSchema), authPreHandler, validatePermission],
    handler: updateDiscountController,
  });

  fastify.post("/api/discount/delete", {
    preHandler: [validateSchema(deleteDiscountSchema), authPreHandler, validatePermission],
    handler: deleteDiscountController,
  });

  // validate endpoint: auth only (cashiers need to apply codes at checkout)
  fastify.post("/api/discount/validate", {
    preHandler: [validateSchema(validateDiscountSchema), authPreHandler],
    handler: validateDiscountController,
  });
}
