import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

async function swaggerPlugin(fastify: FastifyInstance) {
    await fastify.register(swagger, {
        openapi: {
            info: {
                title: "ProjectZ API",
                description: "Enterprise Management System API documentation covering Personal, Equipment, Product, Work, Monetary, Unit, Task, Payroll, and Transport modules.",
                version: "1.0.0",
                contact: {
                    name: "ProjectZ Engineering Team",
                },
            },
            servers: [
                {
                    url: `http://${process.env.HOST || "localhost"}:${process.env.PORT || 3000}`,
                    description: "Current Server",
                },
            ],
            tags: [
                { name: "Auth", description: "Authentication and session management" },
                { name: "Personal", description: "Profiles, roles, permissions, contacts, documents" },
                { name: "Associate", description: "Customers, vendors, employees, positions" },
                { name: "Equipment", description: "Equipment entities, types, brands, models, maintenance, parts" },
                { name: "Product", description: "Products, categories, prices, images, inventory, attributes" },
                { name: "Monetary", description: "Accounts, balances, transactions" },
                { name: "Unit", description: "Units of measurement and conversions" },
                { name: "Work", description: "Works, work items, workers, equipment allocations, offers, RFQs, purchase orders" },
                { name: "Task", description: "Task management, assignments, statuses, priorities" },
                { name: "Payroll", description: "Payroll periods, salary components, salary calculation and generation" },
                { name: "Transport", description: "Fleet management: vehicles, drivers, trips, fuel logs" },
                { name: "System", description: "Health check and system diagnostics" },
            ],
            components: {
                securitySchemes: {
                    cookieAuth: {
                        type: "apiKey",
                        in: "cookie",
                        name: "better-auth.session_token",
                        description: "Better Auth session cookie",
                    },
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
        },
    });

    await fastify.register(swaggerUi, {
        routePrefix: "/documentation",
        uiConfig: {
            docExpansion: "list",
            deepLinking: true,
        },
        staticCSP: false,
    });
}

export default fp(swaggerPlugin, {
    name: "swagger-plugin",
});
