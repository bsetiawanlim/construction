import { describe, it, expect, beforeAll } from "vitest";
import { getTestApp, getAdminAuthCookie } from "./helpers";
import type { FastifyInstance } from "fastify";

describe("Product Catalog API", () => {
    let app: FastifyInstance;
    let authCookie: string;

    beforeAll(async () => {
        app = await getTestApp();
        authCookie = await getAdminAuthCookie();
    });

    it("POST /api/product/get-all returns products list", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/product/get-all",
            headers: { cookie: authCookie },
            payload: { limit: 10 },
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body);
        expect(payload.success).toBe(true);
        expect(Array.isArray(payload.data)).toBe(true);
        expect(payload.data.length).toBeGreaterThan(0);
    });

    it("POST /api/product-recipe/get-all returns recipes list", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/product-recipe/get-all",
            headers: { cookie: authCookie },
            payload: { limit: 50 },
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body);
        expect(payload.success).toBe(true);
        expect(Array.isArray(payload.data)).toBe(true);
    });

    it("POST /api/production-batch/get-all returns production batches list", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/production-batch/get-all",
            headers: { cookie: authCookie },
            payload: { limit: 10 },
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body);
        expect(payload.success).toBe(true);
        expect(Array.isArray(payload.data)).toBe(true);
    });
});
