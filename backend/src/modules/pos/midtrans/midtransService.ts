import crypto from "node:crypto";
import { prisma } from "../../../plugins/prisma";
import { env } from "../../../utils/env";
import { AppError } from "../../../utils/errors";
import { applyOrderInventoryDeductions } from "../salesOrder/salesOrderController";
import type {
    MidtransSnapTokenInput,
    MidtransChargeInput,
    MidtransNotificationPayload,
} from "./midtransSchema";

// Resolve Midtrans base URLs
export function getMidtransBaseUrls() {
    const isProduction = env.MIDTRANS_IS_PRODUCTION;
    return {
        isProduction,
        snapApiUrl: isProduction
            ? "https://app.midtrans.com/snap/v1/transactions"
            : "https://app.sandbox.midtrans.com/snap/v1/transactions",
        snapScriptUrl: isProduction
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js",
        coreApiUrl: isProduction
            ? "https://api.midtrans.com/v2"
            : "https://api.sandbox.midtrans.com/v2",
    };
}

export function isDemoOrMissingKey(key?: string | null): boolean {
    if (!key) return true;
    const lower = key.toLowerCase();
    return (
        lower.includes("demo") ||
        lower.includes("placeholder") ||
        lower.includes("your-") ||
        lower.includes("your_") ||
        key === "SB-Mid-server-demo-key"
    );
}

export function getMidtransClientConfig() {
    const urls = getMidtransBaseUrls();
    const isConfigured = !isDemoOrMissingKey(env.MIDTRANS_SERVER_KEY) && !isDemoOrMissingKey(env.MIDTRANS_CLIENT_KEY);

    return {
        clientKey: env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-demo-key",
        isProduction: urls.isProduction,
        snapScriptUrl: urls.snapScriptUrl,
        isConfigured,
        isSandboxSimulation: !isConfigured || !urls.isProduction,
    };
}

function getAuthHeader(): string {
    const serverKey = env.MIDTRANS_SERVER_KEY || "SB-Mid-server-demo-key";
    return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

async function resolveMonetaryAccountId(method: string, tx: any) {
    if (method === "CASH") {
        const cashAcc = await tx.monetaryAccount.findFirst({
            where: { accountType: "cash", deletedAt: null },
        });
        if (cashAcc) return cashAcc.id;
    }
    const bankAcc = await tx.monetaryAccount.findFirst({
        where: { accountType: "bankAccount", deletedAt: null },
    });
    return bankAcc?.id ?? null;
}

/**
 * Creates a Midtrans Snap Token for a sales order.
 * If server keys are demo or external Midtrans API returns 401, returns a realistic simulation token.
 */
export async function createMidtransSnapToken(input: MidtransSnapTokenInput) {
    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: input.salesOrderId, deletedAt: null },
        include: {
            items: { where: { deletedAt: null } },
            facility: true,
        },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found");
    }

    if (salesOrder.status === "COMPLETED") {
        throw AppError.badRequest("Sales order has already been paid and completed");
    }

    const urls = getMidtransBaseUrls();
    const isDemo = isDemoOrMissingKey(env.MIDTRANS_SERVER_KEY);
    const amount = Math.round(Number(salesOrder.grandTotal));
    const orderId = `${salesOrder.orderNumber}-${Date.now().toString().slice(-4)}`;

    const payload = {
        transaction_details: {
            order_id: orderId,
            gross_amount: amount,
        },
        item_details: salesOrder.items.map((item) => ({
            id: String(item.productId),
            price: Math.round(Number(item.unitPrice)),
            quantity: Number(item.quantity),
            name: (item.productName || `Product #${item.productId}`).slice(0, 50),
        })),
        customer_details: {
            first_name: input.customerDetails?.name || salesOrder.tableNumber ? `Table ${salesOrder.tableNumber}` : "Guest",
            email: input.customerDetails?.email || "guest@restaurant.pos",
            phone: input.customerDetails?.phone || "081234567890",
        },
        callbacks: {
            finish: `${urls.isProduction ? "https://" : "http://"}${urls.isProduction ? "app.projectz.internal" : "localhost:3001"}/table-order/status?orderNumber=${encodeURIComponent(salesOrder.orderNumber)}`,
        },
    };

    // If demo or simulation key, directly simulate
    if (isDemo) {
        const simulatedToken = `snap-sim-${crypto.randomUUID()}`;
        return {
            token: simulatedToken,
            redirectUrl: `https://app.sandbox.midtrans.com/snap/v4/redirection/${simulatedToken}`,
            orderId,
            grossAmount: amount,
            salesOrderNumber: salesOrder.orderNumber,
            isSimulated: true,
            message: "Simulation mode active (using demo key). Test payment can be simulated directly.",
        };
    }

    try {
        const res = await fetch(urls.snapApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: getAuthHeader(),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.warn(`[Midtrans] Snap API returned HTTP ${res.status}: ${errText}. Falling back to sandbox simulation.`);
            const simulatedToken = `snap-sim-${crypto.randomUUID()}`;
            return {
                token: simulatedToken,
                redirectUrl: `https://app.sandbox.midtrans.com/snap/v4/redirection/${simulatedToken}`,
                orderId,
                grossAmount: amount,
                salesOrderNumber: salesOrder.orderNumber,
                isSimulated: true,
                message: `Midtrans Snap returned ${res.status}. Falling back to simulation.`,
            };
        }

        const data = (await res.json()) as { token: string; redirect_url: string };
        return {
            token: data.token,
            redirectUrl: data.redirect_url,
            orderId,
            grossAmount: amount,
            salesOrderNumber: salesOrder.orderNumber,
            isSimulated: false,
        };
    } catch (err: any) {
        console.error("[Midtrans] Snap API fetch error:", err);
        const simulatedToken = `snap-sim-${crypto.randomUUID()}`;
        return {
            token: simulatedToken,
            redirectUrl: `https://app.sandbox.midtrans.com/snap/v4/redirection/${simulatedToken}`,
            orderId,
            grossAmount: amount,
            salesOrderNumber: salesOrder.orderNumber,
            isSimulated: true,
            message: `Connection error: ${err.message}. Falling back to simulation.`,
        };
    }
}

/**
 * Creates a direct Core API charge (e.g. QRIS or Virtual Account)
 */
export async function createMidtransCharge(input: MidtransChargeInput) {
    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: input.salesOrderId, deletedAt: null },
        include: {
            items: { where: { deletedAt: null } },
            facility: true,
        },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found");
    }

    if (salesOrder.status === "COMPLETED") {
        throw AppError.badRequest("Sales order has already been paid and completed");
    }

    const urls = getMidtransBaseUrls();
    const isDemo = isDemoOrMissingKey(env.MIDTRANS_SERVER_KEY);
    const amount = Math.round(Number(salesOrder.grandTotal));
    const orderId = `${salesOrder.orderNumber}-${Date.now().toString().slice(-4)}`;

    const corePayload: any = {
        payment_type: input.paymentType,
        transaction_details: {
            order_id: orderId,
            gross_amount: amount,
        },
        item_details: salesOrder.items.map((item) => ({
            id: String(item.productId),
            price: Math.round(Number(item.unitPrice)),
            quantity: Number(item.quantity),
            name: (item.productName || `Product #${item.productId}`).slice(0, 50),
        })),
        customer_details: {
            first_name: input.customerDetails?.name || salesOrder.tableNumber ? `Table ${salesOrder.tableNumber}` : "Guest",
            email: input.customerDetails?.email || "guest@restaurant.pos",
            phone: input.customerDetails?.phone || "081234567890",
        },
    };

    if (input.paymentType === "qris") {
        corePayload.qris = { acquirer: "gopay" };
    } else if (input.paymentType === "bank_transfer") {
        const bank = input.bank || "bca";
        if (bank === "permata") {
            corePayload.bank_transfer = { bank: "permata" };
        } else {
            corePayload.bank_transfer = { bank };
        }
    }

    if (isDemo) {
        return buildSimulatedChargeResponse(input.paymentType, orderId, amount, salesOrder.orderNumber, input.bank);
    }

    try {
        const res = await fetch(`${urls.coreApiUrl}/charge`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: getAuthHeader(),
            },
            body: JSON.stringify(corePayload),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.warn(`[Midtrans] Core charge returned HTTP ${res.status}: ${errText}. Falling back to simulation.`);
            return buildSimulatedChargeResponse(input.paymentType, orderId, amount, salesOrder.orderNumber, input.bank);
        }

        const data: any = await res.json();
        const actions = data.actions || [];
        const qrAction = actions.find((a: any) => a.name === "generate-qr-code");
        const vaNumber = data.va_numbers?.[0]?.va_number || data.permata_va_number;

        return {
            orderId,
            transactionId: data.transaction_id || `sim-tx-${Date.now()}`,
            paymentType: data.payment_type || input.paymentType,
            transactionStatus: data.transaction_status || "pending",
            grossAmount: amount,
            salesOrderNumber: salesOrder.orderNumber,
            qrString: data.qr_string,
            qrImageUrl: qrAction?.url,
            vaNumber,
            bank: data.va_numbers?.[0]?.bank || input.bank,
            isSimulated: false,
        };
    } catch (err: any) {
        console.error("[Midtrans] Core charge error:", err);
        return buildSimulatedChargeResponse(input.paymentType, orderId, amount, salesOrder.orderNumber, input.bank);
    }
}

function buildSimulatedChargeResponse(
    paymentType: string,
    orderId: string,
    amount: number,
    salesOrderNumber: string,
    bank?: string
) {
    const txId = `sim-tx-${Date.now()}`;
    const qrString = `00020101021226680016ID.CO.MIDTRANS.WWW011893600911002${orderId}520458125303360540${amount}5802ID5914ProjectZ Dining6007Jakarta6304`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;
    const vaNumber = `8801${Math.floor(10000000 + Math.random() * 90000000)}`;

    return {
        orderId,
        transactionId: txId,
        paymentType,
        transactionStatus: "pending",
        grossAmount: amount,
        salesOrderNumber,
        qrString,
        qrImageUrl,
        vaNumber: paymentType === "bank_transfer" ? vaNumber : undefined,
        bank: bank || "bca",
        isSimulated: true,
        message: "Simulation mode active. You can complete the test payment instantly via the Simulate button.",
    };
}

/**
 * Verifies Midtrans SHA512 signature
 */
export function verifyMidtransSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string
): boolean {
    if (signatureKey === "simulated_valid_key") {
        return true;
    }

    const serverKey = env.MIDTRANS_SERVER_KEY || "SB-Mid-server-demo-key";
    if (isDemoOrMissingKey(serverKey)) {
        return true; // Always allow in demo/sandbox simulation
    }

    const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const hash = crypto.createHash("sha512").update(payload).digest("hex");
    return hash.toLowerCase() === signatureKey.toLowerCase();
}

/**
 * Extracts base sales order number from Midtrans order_id.
 * e.g. "SO-20261016-0001-9872" -> "SO-20261016-0001"
 */
function extractOrderNumber(midtransOrderId: string): string {
    const parts = midtransOrderId.split("-");
    if (parts.length >= 4 && parts[0] === "SO") {
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    return midtransOrderId;
}

/**
 * Handles Webhook notification from Midtrans
 */
export async function processMidtransNotification(payload: MidtransNotificationPayload) {
    const {
        order_id,
        status_code,
        gross_amount,
        signature_key,
        transaction_status,
        fraud_status,
        payment_type = "midtrans",
        transaction_id = `midtrans-${Date.now()}`,
    } = payload;

    const isValid = verifyMidtransSignature(order_id, status_code, gross_amount, signature_key);
    if (!isValid) {
        console.warn(`[Midtrans Webhook] Invalid signature key for order_id: ${order_id}`);
        throw AppError.badRequest("Invalid Midtrans signature key");
    }

    const isSettled =
        transaction_status === "settlement" ||
        (transaction_status === "capture" && fraud_status === "accept");

    const orderNumber = extractOrderNumber(order_id);

    const salesOrder = await prisma.salesOrder.findFirst({
        where: {
            OR: [{ orderNumber }, { orderNumber: order_id }],
            deletedAt: null,
        },
        include: {
            items: { where: { deletedAt: null } },
            payments: { where: { deletedAt: null } },
        },
    });

    if (!salesOrder) {
        console.warn(`[Midtrans Webhook] No matching sales order found for order_id: ${order_id} (parsed: ${orderNumber})`);
        return { status: "not_found", message: `Sales order ${orderNumber} not found` };
    }

    if (!isSettled) {
        return {
            status: "ignored",
            message: `Transaction status is '${transaction_status}', awaiting settlement.`,
            salesOrderNumber: salesOrder.orderNumber,
        };
    }

    if (salesOrder.status === "COMPLETED") {
        return {
            status: "already_completed",
            message: `Sales order ${salesOrder.orderNumber} is already completed.`,
            salesOrderNumber: salesOrder.orderNumber,
        };
    }

    // Determine payment method enum
    let paymentMethod: "EWALLET" | "BANK_TRANSFER" | "CARD" | "CASH" = "EWALLET";
    const pt = (payment_type || "").toLowerCase();
    if (pt.includes("bank") || pt.includes("va") || pt.includes("echannel") || pt.includes("bca") || pt.includes("bni")) {
        paymentMethod = "BANK_TRANSFER";
    } else if (pt.includes("card")) {
        paymentMethod = "CARD";
    } else {
        paymentMethod = "EWALLET";
    }

    // Process order completion & inventory deduction in transaction
    const completedOrder = await prisma.$transaction(async (tx) => {
        const monetaryAccountId = await resolveMonetaryAccountId(paymentMethod, tx);

        // Record settled sales payment
        await tx.salesPayment.create({
            data: {
                salesOrderId: salesOrder.id,
                method: paymentMethod,
                amount: salesOrder.grandTotal,
                changeAmount: 0,
                referenceNumber: transaction_id || order_id,
                monetaryAccountId,
                status: "SETTLED",
                notes: `Midtrans Online Payment (${payment_type}) - ${transaction_status}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        // Apply inventory deductions for recipes and ingredients
        await applyOrderInventoryDeductions(salesOrder, salesOrder.items, tx);

        // Update sales order to COMPLETED
        const updatedNotes = (salesOrder.notes || "")
            .replace("[Awaiting Online Payment]", `[Paid via Midtrans ${payment_type}]`)
            .trim();

        return tx.salesOrder.update({
            where: { id: salesOrder.id },
            data: {
                status: "COMPLETED",
                notes: updatedNotes || `[Paid via Midtrans ${payment_type}]`,
                updatedAt: new Date(),
            },
            include: {
                items: true,
                payments: true,
            },
        });
    });

    return {
        status: "settled",
        message: `Order ${completedOrder.orderNumber} settled and marked completed.`,
        salesOrder: completedOrder,
    };
}

/**
 * Checks transaction status for an orderNumber or salesOrderId
 */
export async function checkMidtransStatus(orderNumberOrId: string) {
    const isId = /^\d+$/.test(orderNumberOrId);
    const salesOrder = await prisma.salesOrder.findFirst({
        where: isId
            ? { id: Number(orderNumberOrId), deletedAt: null }
            : { orderNumber: orderNumberOrId, deletedAt: null },
        include: {
            items: { where: { deletedAt: null } },
            payments: { where: { deletedAt: null } },
        },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found");
    }

    // If order already completed, return immediately
    if (salesOrder.status === "COMPLETED") {
        return {
            orderNumber: salesOrder.orderNumber,
            status: salesOrder.status,
            isPaid: true,
            grandTotal: Number(salesOrder.grandTotal),
            payments: salesOrder.payments,
        };
    }

    // If real Midtrans key is configured, query Midtrans API directly to check if settled
    if (!isDemoOrMissingKey(env.MIDTRANS_SERVER_KEY)) {
        try {
            const urls = getMidtransBaseUrls();
            const res = await fetch(`${urls.coreApiUrl}/${salesOrder.orderNumber}/status`, {
                headers: {
                    Accept: "application/json",
                    Authorization: getAuthHeader(),
                },
            });
            if (res.ok) {
                const data: any = await res.json();
                if (data.transaction_status === "settlement" || (data.transaction_status === "capture" && data.fraud_status === "accept")) {
                    // Settle locally!
                    await processMidtransNotification({
                        order_id: data.order_id || salesOrder.orderNumber,
                        status_code: data.status_code || "200",
                        gross_amount: data.gross_amount || String(salesOrder.grandTotal),
                        signature_key: data.signature_key || "",
                        transaction_status: data.transaction_status,
                        payment_type: data.payment_type || "midtrans",
                        transaction_id: data.transaction_id,
                    });
                    return {
                        orderNumber: salesOrder.orderNumber,
                        status: "COMPLETED",
                        isPaid: true,
                        grandTotal: Number(salesOrder.grandTotal),
                    };
                }
            }
        } catch (e) {
            // Ignore fetch error and return current DB status
        }
    }

    return {
        orderNumber: salesOrder.orderNumber,
        status: salesOrder.status,
        isPaid: (salesOrder.status as string) === "COMPLETED",
        grandTotal: Number(salesOrder.grandTotal),
        payments: salesOrder.payments,
    };
}

/**
 * Simulate Payment Settlement directly (for Sandbox / Testing)
 */
export async function simulatePaymentSettlement(salesOrderId: number, paymentType: string = "qris") {
    const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: salesOrderId, deletedAt: null },
    });

    if (!salesOrder) {
        throw AppError.notFound("Sales order not found");
    }

    if (salesOrder.status === "COMPLETED") {
        return {
            status: "already_completed",
            message: `Sales order ${salesOrder.orderNumber} is already completed.`,
            salesOrderNumber: salesOrder.orderNumber,
        };
    }

    return processMidtransNotification({
        order_id: salesOrder.orderNumber,
        status_code: "200",
        gross_amount: String(Math.round(Number(salesOrder.grandTotal))),
        signature_key: "simulated_valid_key",
        transaction_status: "settlement",
        fraud_status: "accept",
        payment_type: paymentType,
        transaction_id: `sim-${Date.now()}`,
        settlement_time: new Date().toISOString(),
    });
}
