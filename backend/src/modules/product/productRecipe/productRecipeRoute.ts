import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
  createProductRecipeSchema,
  updateProductRecipeSchema,
  deleteProductRecipeSchema,
  setProductRecipeSchema,
  getProductRecipeQuerySchema,
} from "./productRecipeSchema";
import {
  createProductRecipeController,
  updateProductRecipeController,
  deleteProductRecipeController,
  setProductRecipeController,
  getProductRecipesController,
  getRecipeByProductController,
} from "./productRecipeController";

export async function productRecipeRoutes(fastify: FastifyInstance, options: any) {
  fastify.post("/api/product-recipe/create", {
    preHandler: [validateSchema(createProductRecipeSchema), authPreHandler, validatePermission],
    handler: createProductRecipeController,
  });

  fastify.post("/api/product-recipe/set", {
    preHandler: [validateSchema(setProductRecipeSchema), authPreHandler, validatePermission],
    handler: setProductRecipeController,
  });

  fastify.post("/api/product-recipe/update", {
    preHandler: [validateSchema(updateProductRecipeSchema), authPreHandler, validatePermission],
    handler: updateProductRecipeController,
  });

  fastify.post("/api/product-recipe/delete", {
    preHandler: [validateSchema(deleteProductRecipeSchema), authPreHandler, validatePermission],
    handler: deleteProductRecipeController,
  });

  fastify.post("/api/product-recipe/get-all", {
    preHandler: [validateSchema(getProductRecipeQuerySchema), authPreHandler, validatePermission],
    handler: getProductRecipesController,
  });

  fastify.get("/api/product-recipe/by-product/:productId", {
    preHandler: [authPreHandler],
    handler: getRecipeByProductController,
  });
}
