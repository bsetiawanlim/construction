import { FastifyInstance } from "fastify";
import {
    createSalesOrderItemSchema,
    updateSalesOrderItemSchema,
    deleteSalesOrderItemSchema,
    getSalesOrderItemSchema,
    listSalesOrderItemsSchema,
} from "./salesOrderItemSchema";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createSalesOrderItemController,
    updateSalesOrderItemController,
    deleteSalesOrderItemController,
    getSalesOrderItemController,
    listSalesOrderItemsController,
} from "./salesOrderItemController";

export async function salesOrderItemRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/pos/sales-order-item/create", {
        preHandler: [validateSchema(createSalesOrderItemSchema), authPreHandler, validatePermission],
        handler: createSalesOrderItemController,
    });

    fastify.post("/api/pos/sales-order-item/update", {
        preHandler: [validateSchema(updateSalesOrderItemSchema), authPreHandler, validatePermission],
        handler: updateSalesOrderItemController,
    });

    fastify.post("/api/pos/sales-order-item/delete", {
        preHandler: [validateSchema(deleteSalesOrderItemSchema), authPreHandler, validatePermission],
        handler: deleteSalesOrderItemController,
    });

    fastify.post("/api/pos/sales-order-item/get", {
        preHandler: [validateSchema(getSalesOrderItemSchema), authPreHandler, validatePermission],
        handler: getSalesOrderItemController,
    });

    fastify.post("/api/pos/sales-order-item/list", {
        preHandler: [validateSchema(listSalesOrderItemsSchema), authPreHandler, validatePermission],
        handler: listSalesOrderItemsController,
    });
}
