import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { multiSession } from "better-auth/plugins";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    // Check if user already exists based on email
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    });

                    if (existingUser) {
                        throw new Error("USER_ALREADY_EXISTS");
                    }
                },
            },
        },
    },
    // basePath: "/api/auth",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        requirePasswordConfirmation: true,
        autoSignIn: false,
        onExistingUserSignUp: async ({ user }, request) => {
            console.log(`Duplicate sign-up attempt for: ${user.email}`);
            throw new Error("USER_ALREADY_EXISTS", { cause: { statusCode: 400 } });
            // Protip: Send a "Did you forget your password?" email here securely
        },
    },
    logger: {
        disabled: false,
        disableColors: false,
        level: "info",
        log: (level, message, ...args) => {
            console.log(`[${level}] ${message}`, ...args);
        }
    },
    requireEmailVerification: false,
    trustedOrigins: [
        "http://localhost:*",
        "http://127.0.0.1:*",
        "http://192.168.*",
        "http://172.*",
        "http://10.*",
        "http://16.*",
        "http://16.79.68.60",
        "http://16.79.68.60:*",
        "https://localhost:*",
        "https://127.0.0.1:*",
        "https://192.168.*",
        "https://172.*",
        "https://10.*",
        "https://16.*",
        "https://16.79.68.60",
        "https://16.79.68.60:*",
    ],

    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // Cache duration in seconds (5 minutes),
            strategy: "jwe"
        },
        cookie: {
            enabled: true,
            maxAge: 60 * 60 * 24,
        }
    },
    advanced: {
        cookiePrefix: "PZ", // Changes the prefix from the default "better-auth"
        useSecureCookies: process.env.COOKIE_SECURE === "true", // Only force secure cookies if explicitly enabled (HTTPS)
        cookieOptions: {
            // Customize attributes for all cookies
            sameSite: "lax",
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === "true", // Browsers drop secure cookies on plain HTTP
        },

    },
    revokeSessionsOnPasswordReset: true,
    revokeSessionsOnAccountDeletion: true,
    plugins: [
        multiSession({
            maximumSessions: 1
        }),
    ],
    user: {
        additionalFields: {
            profileId: {
                type: "number",
                input: true,
                required: false,
            },
            createdBy: {
                type: "string",
                input: true,
                required: false,
            },
            updatedBy: {
                type: "string",
                input: true,
                required: false
            },
            isSuperAdmin: {
                type: "boolean",
                defaultValue: false,
                input: true,
            },
            roleId: {
                type: "number",
                defaultValue: null,
                input: true,
                required: false,
            }
        }
    },

});






