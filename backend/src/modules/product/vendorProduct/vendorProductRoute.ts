import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
  createVendorProductSchema,
  updateVendorProductSchema,
  deleteVendorProductSchema,
  batchLinkVendorProductsSchema,
  batchLinkProductVendorsSchema,
  getVendorProductsQuerySchema,
} from "./vendorProductSchema";
import {
  createVendorProductController,
  updateVendorProductController,
  deleteVendorProductController,
  batchLinkVendorProductsController,
  batchLinkProductVendorsController,
  getVendorProductsController,
  getProductsByVendorController,
  getVendorsByProductController,
} from "./vendorProductController";

export async function vendorProductRoutes(fastify: FastifyInstance, options: any) {
  fastify.post("/api/vendor-product/create", {
    preHandler: [validateSchema(createVendorProductSchema), authPreHandler, validatePermission],
    handler: createVendorProductController,
  });

  fastify.post("/api/vendor-product/batch-link-products", {
    preHandler: [validateSchema(batchLinkVendorProductsSchema), authPreHandler, validatePermission],
    handler: batchLinkVendorProductsController,
  });

  fastify.post("/api/vendor-product/batch-link-vendors", {
    preHandler: [validateSchema(batchLinkProductVendorsSchema), authPreHandler, validatePermission],
    handler: batchLinkProductVendorsController,
  });

  fastify.post("/api/vendor-product/update", {
    preHandler: [validateSchema(updateVendorProductSchema), authPreHandler, validatePermission],
    handler: updateVendorProductController,
  });

  fastify.post("/api/vendor-product/delete", {
    preHandler: [validateSchema(deleteVendorProductSchema), authPreHandler, validatePermission],
    handler: deleteVendorProductController,
  });

  fastify.post("/api/vendor-product/get-all", {
    preHandler: [authPreHandler, validatePermission],
    handler: getVendorProductsController,
  });

  fastify.get("/api/vendor-product/all", {
    preHandler: [authPreHandler],
    handler: getVendorProductsController,
  });

  fastify.get("/api/vendor-product/by-vendor/:vendorId", {
    preHandler: [authPreHandler],
    handler: getProductsByVendorController,
  });

  fastify.get("/api/vendor-product/by-product/:productId", {
    preHandler: [authPreHandler],
    handler: getVendorsByProductController,
  });
}
