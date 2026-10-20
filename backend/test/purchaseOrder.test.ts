import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getTestApp, getAdminAuthCookie, prisma } from "./helpers";
import type { FastifyInstance } from "fastify";

describe("Purchase Order API", () => {
    let app: FastifyInstance;
    let authCookie: string;
    let createdPoId: number | null = null;
    let createdRfqId: number | null = null;

    beforeAll(async () => {
        app = await getTestApp();
        authCookie = await getAdminAuthCookie();
    });

    afterAll(async () => {
        if (createdPoId) {
            await prisma.purchaseOrderProduct.deleteMany({ where: { purchaseOrderId: createdPoId } });
            await prisma.purchaseOrder.delete({ where: { id: createdPoId } }).catch(() => {});
        }
        if (createdRfqId) {
            await prisma.rfq.delete({ where: { id: createdRfqId } }).catch(() => {});
        }
    });

    it("GET /api/purchase-order/get-all returns 200 and list of purchase orders", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/purchase-order/get-all?limit=10",
            headers: {
                cookie: authCookie,
            },
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body);
        expect(payload.success).toBe(true);
        expect(Array.isArray(payload.data)).toBe(true);
        expect(payload).toHaveProperty("pagination");
    });

    it("POST /api/rfq/create and POST /api/purchase-order/create creates a PO end-to-end", async () => {
        const vendor = await prisma.vendor.findFirst({ where: { deletedAt: null } });
        expect(vendor).toBeDefined();

        const product = await prisma.product.findFirst({
            where: {
                deletedAt: null,
                recipes: { none: {} },
                description: { not: { contains: "---RECIPE_SPEC_START---" } },
            },
        });
        expect(product).toBeDefined();

        // 1. Create RFQ
        const rfqNumber = `RFQ-TEST-${Date.now()}`;
        const rfqRes = await app.inject({
            method: "POST",
            url: "/api/rfq/create",
            headers: { cookie: authCookie },
            payload: {
                vendorId: vendor!.id,
                number: rfqNumber,
                title: "Integration Test RFQ",
                dueDate: new Date(Date.now() + 86400000).toISOString(),
                status: "APPROVED",
                notes: "Automated test RFQ",
            },
        });

        expect(rfqRes.statusCode).toBe(201);
        const rfqBody = JSON.parse(rfqRes.body);
        createdRfqId = rfqBody.data.rfq.id;
        expect(createdRfqId).toBeGreaterThan(0);

        // 2. Create Purchase Order linked to the RFQ
        const poNumber = `PO-TEST-${Date.now()}`;
        const poRes = await app.inject({
            method: "POST",
            url: "/api/purchase-order/create",
            headers: { cookie: authCookie },
            payload: {
                rfqId: createdRfqId,
                vendorId: vendor!.id,
                number: poNumber,
                title: "Integration Test Purchase Order",
                dueDate: new Date(Date.now() + 86400000).toISOString(),
                status: "PENDING",
                totalAmount: 150000,
                products: [
                    {
                        productId: product!.id,
                        quantity: 10,
                        price: 15000,
                        notes: "First batch",
                    },
                ],
            },
        });

        expect(poRes.statusCode).toBe(201);
        const poBody = JSON.parse(poRes.body);
        expect(poBody.success).toBe(true);
        expect(poBody.data.purchaseOrder).toBeDefined();
        createdPoId = poBody.data.purchaseOrder.id;
        expect(poBody.data.purchaseOrder.number).toBe(poNumber);
        expect(poBody.data.purchaseOrder.purchaseOrderProducts.length).toBe(1);

        // 3. Get the created PO
        const getRes = await app.inject({
            method: "POST",
            url: "/api/purchase-order/get",
            headers: { cookie: authCookie },
            payload: { id: createdPoId },
        });

        expect(getRes.statusCode).toBe(200);
        const getBody = JSON.parse(getRes.body);
        expect(getBody.data.purchaseOrder.id).toBe(createdPoId);
    });

    it("POST /api/purchase-order/create rejects duplicate PO for the same RFQ", async () => {
        if (!createdRfqId) return;

        const vendor = await prisma.vendor.findFirst({ where: { deletedAt: null } });

        const poRes = await app.inject({
            method: "POST",
            url: "/api/purchase-order/create",
            headers: { cookie: authCookie },
            payload: {
                rfqId: createdRfqId,
                vendorId: vendor!.id,
                number: `PO-DUP-${Date.now()}`,
                title: "Duplicate PO",
                dueDate: new Date(Date.now() + 86400000).toISOString(),
                status: "PENDING",
            },
        });

        expect(poRes.statusCode).toBe(409);
    });
});
