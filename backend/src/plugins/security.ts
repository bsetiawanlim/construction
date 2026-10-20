import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

async function securityPlugin(fastify: FastifyInstance) {
    // ── Helmet ────────────────────────────────────────────────────────────
    await fastify.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "validator.swagger.io"],
            },
        },
        crossOriginEmbedderPolicy: false,
    });

    // ── Rate Limiting ──────────────────────────────────────────────────────
    await fastify.register(rateLimit, {
        max: 120, // max 120 requests per minute by default
        timeWindow: "1 minute",
        allowList: (req) => {
            // Allow health checks without rate limiting
            return req.url === "/health" || req.url === "/api/health";
        },
        errorResponseBuilder: (req, context) => {
            return {
                statusCode: 429,
                error: "Too Many Requests",
                message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
                retryAfter: Math.ceil(context.ttl / 1000),
            };
        },
    });
}

export default fp(securityPlugin, {
    name: "security-plugin",
});
