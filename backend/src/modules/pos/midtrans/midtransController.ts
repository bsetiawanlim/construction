import { FastifyReply, FastifyRequest } from "fastify";
import { success, created } from "../../../utils/response";
import {
    getMidtransClientConfig,
    createMidtransSnapToken,
    createMidtransCharge,
    processMidtransNotification,
    checkMidtransStatus,
    simulatePaymentSettlement,
} from "./midtransService";
import type {
    MidtransSnapTokenInput,
    MidtransChargeInput,
    MidtransNotificationPayload,
    MidtransSimulatePaymentInput,
} from "./midtransSchema";

export async function getMidtransConfigController(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const config = getMidtransClientConfig();
    return success(reply, config, "Midtrans configuration retrieved successfully.");
}

export async function createMidtransSnapTokenController(
    request: FastifyRequest<{ Body: MidtransSnapTokenInput }>,
    reply: FastifyReply
) {
    const result = await createMidtransSnapToken(request.body);
    return created(reply, result, "Midtrans Snap transaction token generated successfully.");
}

export async function createMidtransChargeController(
    request: FastifyRequest<{ Body: MidtransChargeInput }>,
    reply: FastifyReply
) {
    const result = await createMidtransCharge(request.body);
    return created(reply, result, `Midtrans charge (${request.body.paymentType}) generated successfully.`);
}

export async function handleMidtransNotificationController(
    request: FastifyRequest<{ Body: MidtransNotificationPayload }>,
    reply: FastifyReply
) {
    const result = await processMidtransNotification(request.body);
    return success(reply, result, "Midtrans notification processed.");
}

export async function checkMidtransStatusController(
    request: FastifyRequest<{ Params: { orderNumberOrId: string } }>,
    reply: FastifyReply
) {
    const { orderNumberOrId } = request.params;
    const result = await checkMidtransStatus(orderNumberOrId);
    return success(reply, result, "Midtrans transaction status fetched.");
}

export async function simulatePaymentSettlementController(
    request: FastifyRequest<{ Body: MidtransSimulatePaymentInput }>,
    reply: FastifyReply
) {
    const { salesOrderId, paymentType } = request.body;
    const result = await simulatePaymentSettlement(salesOrderId, paymentType);
    return success(reply, result, "Simulated payment successfully processed.");
}
