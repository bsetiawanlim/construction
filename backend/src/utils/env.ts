import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default("0.0.0.0"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    BETTER_AUTH_SECRET: z.string().optional().default(""),
    BETTER_AUTH_URL: z.string().optional().default("http://localhost:3000"),
    FRONTEND_URL: z.string().optional(),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
    MIDTRANS_SERVER_KEY: z.string().optional().default("SB-Mid-server-demo-key"),
    MIDTRANS_CLIENT_KEY: z.string().optional().default("SB-Mid-client-demo-key"),
    MIDTRANS_IS_PRODUCTION: z.string().optional().transform((v) => v === "true" || v === "1").default(false),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error("❌ Invalid environment variables:");
        for (const issue of parsed.error.issues) {
            console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
        }
        process.exit(1);
    }

    return parsed.data;
}

export const env = validateEnv();
