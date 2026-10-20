import { FastifyInstance } from "fastify";
import {
    createSalesPaymentSchema,
    updateSalesPaymentSchema,
    deleteSalesPaymentSchema,
    getSalesPaymentSchema,
    listSalesPaymentsSchema,
} from "./salesPaymentSchema";
import { authPreHandler } from "../../personal/auth/authController";
import { validateSchema } from "../../../plugins/zod";
import validatePermission from "../../../plugins/permission";
import {
    createSalesPaymentController,
    updateSalesPaymentController,
    deleteSalesPaymentController,
    getSalesPaymentController,
    listSalesPaymentsController,
} from "./salesPaymentController";

export async function salesPaymentRoutes(fastify: FastifyInstance, options: any) {
    fastify.post("/api/pos/sales-payment/create", {
        preHandler: [validateSchema(createSalesPaymentSchema), authPreHandler, validatePermission],
        handler: createSalesPaymentController,
    });

    fastify.post("/api/pos/sales-payment/update", {
        preHandler: [validateSchema(updateSalesPaymentSchema), authPreHandler, validatePermission],
        handler: updateSalesPaymentController,
    });

    fastify.post("/api/pos/sales-payment/delete", {
        preHandler: [validateSchema(deleteSalesPaymentSchema), authPreHandler, validatePermission],
        handler: deleteSalesPaymentController,
    });

    fastify.post("/api/pos/sales-payment/get", {
        preHandler: [validateSchema(getSalesPaymentSchema), authPreHandler, validatePermission],
        handler: getSalesPaymentController,
    });

    fastify.post("/api/pos/sales-payment/list", {
        preHandler: [validateSchema(listSalesPaymentsSchema), authPreHandler, validatePermission],
        handler: listSalesPaymentsController,
    });
}
