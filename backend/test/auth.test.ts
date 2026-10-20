import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getTestApp, getAdminAuthCookie, TEST_ADMIN_EMAIL, prisma } from "./helpers";
import { auth } from "../src/plugins/auth";
import type { FastifyInstance } from "fastify";

describe("Auth API", () => {
    let app: FastifyInstance;
    const testEmail = `authtest_${Date.now()}@example.com`;
    const testPassword = "ValidPassword123!";
    let testUserId: string | null = null;

    beforeAll(async () => {
        app = await getTestApp();
        const anyUser = await prisma.user.findFirst();
        const creatorId = anyUser?.id || "admin";

        // Create a test user via Better-Auth
        const signupRes = await auth.api.signUpEmail({
            body: {
                email: testEmail,
                password: testPassword,
                name: "Auth Test User",
                createdBy: creatorId,
            },
        });
        testUserId = signupRes?.user?.id ?? null;
    });

    afterAll(async () => {
        if (testUserId) {
            await prisma.session.deleteMany({ where: { userId: testUserId } });
            await prisma.account.deleteMany({ where: { userId: testUserId } });
            await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
        }
    });

    it("POST /api/auth/sign-in/email returns 200 for valid credentials", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/auth/sign-in/email",
            payload: {
                email: testEmail,
                password: testPassword,
            },
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body);
        expect(payload).toHaveProperty("user");
        expect(payload.user.email).toBe(testEmail);
        expect(response.cookies.length).toBeGreaterThan(0);
    });

    it("POST /api/auth/sign-in/email rejects invalid credentials", async () => {
        const response = await app.inject({
            method: "POST",
            url: "/api/auth/sign-in/email",
            payload: {
                email: testEmail,
                password: "wrongpassword999",
            },
        });

        expect(response.statusCode).toBeGreaterThanOrEqual(400);
    });

    it("GET /api/auth/get-session returns active user session when authenticated", async () => {
        const cookie = await getAdminAuthCookie();

        const response = await app.inject({
            method: "GET",
            url: "/api/auth/get-session",
            headers: {
                cookie,
            },
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body);
        expect(payload).toHaveProperty("user");
        expect(payload.user.email).toBe(TEST_ADMIN_EMAIL);
    });
});
