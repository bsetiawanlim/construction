import { FastifyInstance } from "fastify";
import {
    createSalesOrderSchema,
    updateSalesOrderSchema,
    deleteSalesOrderSchema,
    getSalesOrderSchema,
    completeSalesOrderSchema,
    voidSalesOrderSchema,
    refundSalesOrderSchema,
    salesOrderQuerySchema,
    dailySalesSummarySchema,
    productSalesReportSchema,
    createTableOrderSchema,
    payTableOrderSchema,
    getTableOrderStatusSchema,
    getTableMenuSchema,
    checkTableDinerSchema,
    sendTableReceiptSchema,
} from "./salesOrderSchema";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createSalesOrderController,
    updateSalesOrderController,
    deleteSalesOrderController,
    getSalesOrderController,
    getAllSalesOrdersController,
    completeSalesOrderController,
    voidSalesOrderController,
    refundSalesOrderController,
    getDailySalesSummaryController,
    getProductSalesReportController,
    createTableOrderController,
    payTableOrderController,
    getTableOrderStatusController,
    getTableMenuController,
    checkTableDinerController,
    sendTableReceiptController,
} from "./salesOrderController";

export async function salesOrderRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/pos/sales-order/create", {
        preHandler: [validateSchema(createSalesOrderSchema), authPreHandler, validatePermission],
        handler: createSalesOrderController,
    });

    fastify.post("/api/pos/sales-order/update", {
        preHandler: [validateSchema(updateSalesOrderSchema), authPreHandler, validatePermission],
        handler: updateSalesOrderController,
    });

    fastify.post("/api/pos/sales-order/delete", {
        preHandler: [validateSchema(deleteSalesOrderSchema), authPreHandler, validatePermission],
        handler: deleteSalesOrderController,
    });

    fastify.post("/api/pos/sales-order/get", {
        preHandler: [validateSchema(getSalesOrderSchema), authPreHandler, validatePermission],
        handler: getSalesOrderController,
    });

    fastify.get("/api/pos/sales-order/all", {
        preHandler: [validateSchema(salesOrderQuerySchema, "query"), authPreHandler, validatePermission],
        handler: getAllSalesOrdersController,
    });

    fastify.post("/api/pos/sales-order/complete", {
        preHandler: [validateSchema(completeSalesOrderSchema), authPreHandler, validatePermission],
        handler: completeSalesOrderController,
    });

    fastify.post("/api/pos/sales-order/void", {
        preHandler: [validateSchema(voidSalesOrderSchema), authPreHandler, validatePermission],
        handler: voidSalesOrderController,
    });

    fastify.post("/api/pos/sales-order/refund", {
        preHandler: [validateSchema(refundSalesOrderSchema), authPreHandler, validatePermission],
        handler: refundSalesOrderController,
    });

    fastify.get("/api/pos/sales-order/summary/daily", {
        preHandler: [validateSchema(dailySalesSummarySchema, "query"), authPreHandler, validatePermission],
        handler: getDailySalesSummaryController,
    });

    fastify.get("/api/pos/sales-order/report/product-sales", {
        preHandler: [validateSchema(productSalesReportSchema, "query"), authPreHandler, validatePermission],
        handler: getProductSalesReportController,
    });

    // ── Table Order (Public Table Ordering from Barcode / QR Code) ──
    fastify.get("/api/pos/table-order/menu", {
        preHandler: [validateSchema(getTableMenuSchema, "query")],
        handler: getTableMenuController,
    });

    fastify.post("/api/pos/table-order/create", {
        preHandler: [validateSchema(createTableOrderSchema)],
        handler: createTableOrderController,
    });

    fastify.post("/api/pos/table-order/pay", {
        preHandler: [validateSchema(payTableOrderSchema)],
        handler: payTableOrderController,
    });

    fastify.get("/api/pos/table-order/status", {
        preHandler: [validateSchema(getTableOrderStatusSchema, "query")],
        handler: getTableOrderStatusController,
    });

    fastify.get("/api/pos/table-order/check-diner", {
        preHandler: [validateSchema(checkTableDinerSchema, "query")],
        handler: checkTableDinerController,
    });

    fastify.post("/api/pos/table-order/send-receipt", {
        preHandler: [validateSchema(sendTableReceiptSchema)],
        handler: sendTableReceiptController,
    });

    // Cashier-facing receipt sender (requires auth)
    fastify.post("/api/pos/sales-order/send-receipt", {
        preHandler: [validateSchema(sendTableReceiptSchema), authPreHandler],
        handler: sendTableReceiptController,
    });
}
