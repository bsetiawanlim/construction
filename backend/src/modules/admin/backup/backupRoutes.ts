import { FastifyInstance } from "fastify";
import { authPreHandler } from "../../personal/auth/authController";
import { requireSuperAdmin, listBackups, createBackup, downloadBackup, deleteBackup, restoreBackup } from "./backupController";

export async function backupRoutes(fastify: FastifyInstance) {
    const preHandler = [authPreHandler, requireSuperAdmin];

    fastify.get("/api/admin/backups", { preHandler, handler: listBackups });
    fastify.post("/api/admin/backups", { preHandler, handler: createBackup });
    fastify.get("/api/admin/backups/:filename/download", { preHandler, handler: downloadBackup });
    fastify.delete("/api/admin/backups/:filename", { preHandler, handler: deleteBackup });
    fastify.post("/api/admin/backups/:filename/restore", { preHandler, handler: restoreBackup });
}
