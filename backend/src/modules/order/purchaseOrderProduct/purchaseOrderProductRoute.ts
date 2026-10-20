import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createPurchaseOrderProductSchema,
    updatePurchaseOrderProductSchema,
    deletePurchaseOrderProductSchema,
    getPurchaseOrderProductSchema,
} from "./purchaseOrderProductSchema";
import {
    createPurchaseOrderProductController,
    updatePurchaseOrderProductController,
    deletePurchaseOrderProductController,
    getPurchaseOrderProductsController,
} from "./purchaseOrderProductController";

export async function purchaseOrderProductRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/purchase-order/product/create", {
        preHandler: [validateSchema(createPurchaseOrderProductSchema), authPreHandler, validatePermission],
        handler: createPurchaseOrderProductController,
    });

    fastify.post("/api/purchase-order/product/update", {
        preHandler: [validateSchema(updatePurchaseOrderProductSchema), authPreHandler, validatePermission],
        handler: updatePurchaseOrderProductController,
    });

    fastify.post("/api/purchase-order/product/delete", {
        preHandler: [validateSchema(deletePurchaseOrderProductSchema), authPreHandler, validatePermission],
        handler: deletePurchaseOrderProductController,
    });

    fastify.post("/api/purchase-order/product/get-by-po", {
        preHandler: [validateSchema(getPurchaseOrderProductSchema), authPreHandler, validatePermission],
        handler: getPurchaseOrderProductsController,
    });
}
