import { fastify } from "fastify";
import cors from "@fastify/cors";
import { env } from "./utils/env";
import routes from "./routes/routes";
import prismaPlugin from "./plugins/prisma";
import errorHandlerPlugin from "./plugins/errorHandler";
import securityPlugin from "./plugins/security";
import swaggerPlugin from "./plugins/swagger";
import { healthCheckRoutes } from "./routes/healthCheck";

export const app = fastify({
    logger: env.NODE_ENV === "test"
        ? false
        : {
            level: env.LOG_LEVEL,
            transport: env.NODE_ENV !== "production"
                ? {
                    target: "pino/file",
                    options: { destination: 1 }
                }
                : undefined
        }
});

let appInitialized = false;
export const initApp = async () => {
    if (appInitialized) return app;

    // 1. Security & Protection (Helmet, Rate Limiting)
    await app.register(securityPlugin);

    // 2. CORS
    await app.register(cors, {
        origin: (origin, cb) => {
            // Allow mobile apps, curl, server-to-server or headless requests without origin
            if (!origin) return cb(null, true);

            const allowedOrigins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://localhost:3001",
                "http://16.79.68.60",
                "https://16.79.68.60",
            ];

            if (env.FRONTEND_URL) {
                allowedOrigins.push(env.FRONTEND_URL);
            }

            const isLocalOrPrivate =
                /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
                /^https?:\/\/(16\.79\.68\.60|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);

            if (allowedOrigins.includes(origin) || isLocalOrPrivate || env.NODE_ENV !== "production") {
                return cb(null, true);
            }

            return cb(new Error("Not allowed by CORS"), false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Cookie",
            "Set-Cookie"
        ],
        exposedHeaders: ["Set-Cookie"]
    });

    // 3. Global Error Handler & Core Plugins
    await app.register(errorHandlerPlugin);
    await app.register(prismaPlugin);

    // 4. OpenAPI / Swagger Documentation
    await app.register(swaggerPlugin);

    // 5. Application Routes
    await app.register(healthCheckRoutes);
    await app.register(routes);

    await app.ready();
    appInitialized = true;
    return app;
};

const start = async () => {
    await initApp();

    const port = env.PORT;
    const host = env.HOST;

    // Graceful shutdown handling
    const handleShutdown = async (signal: string) => {
        app.log.info(`Received ${signal}. Shutting down gracefully...`);
        try {
            await app.close();
            app.log.info("Server closed successfully.");
            process.exit(0);
        } catch (err) {
            app.log.error(err, "Error during graceful shutdown");
            process.exit(1);
        }
    };

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));

    try {
        await app.listen({ port, host });
        app.log.info(`🚀 Server running at http://${host}:${port}`);
        app.log.info(`📚 Swagger documentation available at http://${host}:${port}/documentation`);
    } catch (err) {
        app.log.error(err, "Failed to start server");
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
    start();
}

export default app;
