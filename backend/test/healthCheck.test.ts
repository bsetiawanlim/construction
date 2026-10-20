import { describe, it, expect, beforeAll } from "vitest";
import { getTestApp } from "./helpers";
import type { FastifyInstance } from "fastify";

describe("Health Check API", () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await getTestApp();
    });

    it("GET /api/health returns 200 with database connected", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/health",
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body);
        expect(payload.status).toBe("ok");
        expect(payload.services.database).toBe("connected");
        expect(payload).toHaveProperty("timestamp");
        expect(payload).toHaveProperty("uptime");
    });
});
