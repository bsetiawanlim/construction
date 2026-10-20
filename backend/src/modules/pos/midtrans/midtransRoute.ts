import { FastifyInstance } from "fastify";
import { validateSchema } from "../../../plugins/zod";
import {
    midtransSnapTokenSchema,
    midtransChargeSchema,
    midtransNotificationSchema,
    midtransSimulatePaymentSchema,
} from "./midtransSchema";
import {
    getMidtransConfigController,
    createMidtransSnapTokenController,
    createMidtransChargeController,
    handleMidtransNotificationController,
    checkMidtransStatusController,
    simulatePaymentSettlementController,
} from "./midtransController";

export async function midtransRoutes(fastify: FastifyInstance, _options: any) {
    // Public config endpoint for frontend Snap integration
    fastify.get("/api/pos/midtrans/config", {
        handler: getMidtransConfigController,
    });

    // Generate Snap payment token
    fastify.post("/api/pos/midtrans/snap-token", {
        preHandler: [validateSchema(midtransSnapTokenSchema)],
        handler: createMidtransSnapTokenController,
    });

    // Core API Charge (Direct QRIS / VA creation)
    fastify.post("/api/pos/midtrans/charge", {
        preHandler: [validateSchema(midtransChargeSchema)],
        handler: createMidtransChargeController,
    });

    // Webhook notification endpoint called by Midtrans
    fastify.post("/api/pos/midtrans/notification", {
        preHandler: [validateSchema(midtransNotificationSchema)],
        handler: handleMidtransNotificationController,
    });

    // Check payment & settlement status
    fastify.get("/api/pos/midtrans/status/:orderNumberOrId", {
        handler: checkMidtransStatusController,
    });

    // Direct simulation endpoint for sandbox/development testing
    fastify.post("/api/pos/midtrans/simulate-payment", {
        preHandler: [validateSchema(midtransSimulatePaymentSchema)],
        handler: simulatePaymentSettlementController,
    });
}
