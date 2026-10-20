import { FastifyInstance } from "fastify";
import { prisma } from "../plugins/prisma";

export async function healthCheckRoutes(fastify: FastifyInstance) {
    fastify.get("/api/health", async (_request, reply) => {
        let dbStatus = "connected";
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (error) {
            dbStatus = "disconnected";
            fastify.log.error(error, "Health check database ping failed");
        }

        const isHealthy = dbStatus === "connected";
        const statusCode = isHealthy ? 200 : 503;

        return reply.status(statusCode).send({
            status: isHealthy ? "ok" : "degraded",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
            services: {
                database: dbStatus
            }
        });
    });
}
