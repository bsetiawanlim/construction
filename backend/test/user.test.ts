import { describe, it, expect, beforeAll } from "vitest";
import { getTestApp, getAdminAuthCookie, prisma } from "./helpers";
import type { FastifyInstance } from "fastify";

describe("User Account Management API", () => {
    let app: FastifyInstance;
    let authCookie: string;

    beforeAll(async () => {
        app = await getTestApp();
        authCookie = await getAdminAuthCookie();
    });

    it("GET /api/user/get-all returns user accounts", async () => {
        const response = await app.inject({
            method: "GET",
            url: "/api/user/get-all",
            headers: { cookie: authCookie },
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body);
        expect(payload.success).toBe(true);
        expect(Array.isArray(payload.data)).toBe(true);
        expect(payload.data.length).toBeGreaterThan(0);
        expect(payload.data[0]).toHaveProperty("email");
    });

    it("POST /api/user/check-delete scans for linked database records", async () => {
        const adminUser = await prisma.user.findFirst({ where: { email: "b.setiawan.lim@test.com" } });
        expect(adminUser).toBeDefined();

        const response = await app.inject({
            method: "POST",
            url: "/api/user/check-delete",
            headers: { cookie: authCookie },
            payload: { id: adminUser!.id },
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.body);
        expect(payload.success).toBe(true);
        expect(payload.data).toHaveProperty("canDelete");
        expect(payload.data).toHaveProperty("isDeactivated");
        expect(payload.data).toHaveProperty("relatedRecords");
        expect(Array.isArray(payload.data.relatedRecords)).toBe(true);
        // Admin user created records, so canDelete should be false
        expect(payload.data.canDelete).toBe(false);
        expect(payload.data.relatedRecords.length).toBeGreaterThan(0);
    });

    it("POST /api/user/delete prevents deleting users with active relationships", async () => {
        const adminUser = await prisma.user.findFirst({ where: { email: "b.setiawan.lim@test.com" } });
        expect(adminUser).toBeDefined();

        // 1. Attempting to delete an active user fails with 400
        const activeRes = await app.inject({
            method: "POST",
            url: "/api/user/delete",
            headers: { cookie: authCookie },
            payload: { id: adminUser!.id },
        });

        expect(activeRes.statusCode).toBe(400);
        const activePayload = JSON.parse(activeRes.body);
        expect(activePayload.error).toMatch(/Only deactivated users can be deleted/);

        // 2. Create a deactivated test user with linked profile to test relationship block
        const testUserWithRel = await prisma.user.create({
            data: {
                id: `test_rel_user_${Date.now()}`,
                email: `test_rel_${Date.now()}@example.com`,
                name: "Rel Test User",
                emailVerified: true,
                deletedAt: new Date(), // deactivated
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        const profile = await prisma.profile.findFirst();
        if (profile) {
            await prisma.user.update({
                where: { id: testUserWithRel.id },
                data: { profileId: profile.id },
            });
        }

        const deleteRes = await app.inject({
            method: "POST",
            url: "/api/user/delete",
            headers: { cookie: authCookie },
            payload: { id: testUserWithRel.id },
        });

        expect(deleteRes.statusCode).toBe(400);
        const deletePayload = JSON.parse(deleteRes.body);
        expect(deletePayload.error).toMatch(/Cannot delete user/);

        // Cleanup
        await prisma.user.delete({ where: { id: testUserWithRel.id } });
    });
});
