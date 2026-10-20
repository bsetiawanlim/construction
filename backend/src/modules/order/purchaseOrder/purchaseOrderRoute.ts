import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import { paginationQuerySchema } from "../../../utils/pagination";
import {
    createPurchaseOrderSchema,
    updatePurchaseOrderSchema,
    deletePurchaseOrderSchema,
    getPurchaseOrderSchema,
} from "./purchaseOrderSchema";
import {
    createPurchaseOrderController,
    updatePurchaseOrderController,
    deletePurchaseOrderController,
    getPurchaseOrderController,
    getPurchaseOrdersController,
} from "./purchaseOrderController";

export async function purchaseOrderRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/purchase-order/create", {
        preHandler: [validateSchema(createPurchaseOrderSchema), authPreHandler, validatePermission],
        handler: createPurchaseOrderController,
    });

    fastify.post("/api/purchase-order/update", {
        preHandler: [validateSchema(updatePurchaseOrderSchema), authPreHandler, validatePermission],
        handler: updatePurchaseOrderController,
    });

    fastify.post("/api/purchase-order/delete", {
        preHandler: [validateSchema(deletePurchaseOrderSchema), authPreHandler, validatePermission],
        handler: deletePurchaseOrderController,
    });

    fastify.post("/api/purchase-order/get", {
        preHandler: [validateSchema(getPurchaseOrderSchema), authPreHandler, validatePermission],
        handler: getPurchaseOrderController,
    });

    fastify.get("/api/purchase-order/get-all", {
        preHandler: [validateSchema(paginationQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getPurchaseOrdersController,
    });
}
