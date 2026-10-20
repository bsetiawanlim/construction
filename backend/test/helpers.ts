import { initApp } from "../src/server";
import { prisma } from "../src/plugins/prisma";
import { auth } from "../src/plugins/auth";
import type { FastifyInstance } from "fastify";

let testApp: FastifyInstance | null = null;

export async function getTestApp(): Promise<FastifyInstance> {
    if (!testApp) {
        testApp = await initApp();
    }
    return testApp;
}

export const TEST_ADMIN_EMAIL = "test.superadmin@projectz.local";
export const TEST_ADMIN_PASSWORD = "AdminPassword123!";
let cachedCookie: string | null = null;

export async function getAdminAuthCookie(): Promise<string> {
    if (cachedCookie) return cachedCookie;

    const app = await getTestApp();

    // Check if test admin exists
    const existing = await prisma.user.findFirst({
        where: { email: TEST_ADMIN_EMAIL },
    });

    const anyUser = await prisma.user.findFirst();
    const creatorId = anyUser?.id || "admin";

    if (!existing) {
        try {
            await auth.api.signUpEmail({
                body: {
                    email: TEST_ADMIN_EMAIL,
                    password: TEST_ADMIN_PASSWORD,
                    name: "Test SuperAdmin",
                    isSuperAdmin: true,
                    createdBy: creatorId,
                },
            });
        } catch {
            // In case created concurrently
        }
        await prisma.user.updateMany({
            where: { email: TEST_ADMIN_EMAIL },
            data: { isSuperAdmin: true },
        });
    }

    // Try sign in
    let loginRes = await app.inject({
        method: "POST",
        url: "/api/auth/sign-in/email",
        payload: {
            email: TEST_ADMIN_EMAIL,
            password: TEST_ADMIN_PASSWORD,
        },
    });

    // If password mismatch (e.g. from previous run), recreate user
    if (loginRes.statusCode !== 200) {
        const u = await prisma.user.findFirst({ where: { email: TEST_ADMIN_EMAIL } });
        if (u) {
            await prisma.session.deleteMany({ where: { userId: u.id } });
            await prisma.account.deleteMany({ where: { userId: u.id } });
            await prisma.user.delete({ where: { id: u.id } });
        }
        await auth.api.signUpEmail({
            body: {
                email: TEST_ADMIN_EMAIL,
                password: TEST_ADMIN_PASSWORD,
                name: "Test SuperAdmin",
                isSuperAdmin: true,
                createdBy: creatorId,
            },
        });
        await prisma.user.update({
            where: { email: TEST_ADMIN_EMAIL },
            data: { isSuperAdmin: true },
        });

        loginRes = await app.inject({
            method: "POST",
            url: "/api/auth/sign-in/email",
            payload: {
                email: TEST_ADMIN_EMAIL,
                password: TEST_ADMIN_PASSWORD,
            },
        });
    }

    if (loginRes.statusCode !== 200) {
        throw new Error(`Failed to sign in test admin: ${loginRes.body}`);
    }

    const setCookies = loginRes.cookies || [];
    if (setCookies.length === 0) {
        // Fallback to headers
        const raw = loginRes.headers["set-cookie"];
        const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
        cachedCookie = arr.map((s) => s.split(";")[0]).join("; ");
    } else {
        cachedCookie = setCookies.map((c) => `${c.name}=${c.value}`).join("; ");
    }

    return cachedCookie;
}

export { prisma };
