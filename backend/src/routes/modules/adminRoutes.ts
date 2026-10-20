import { FastifyInstance } from "fastify";
import { backupRoutes } from "../../modules/admin/backup/backupRoutes";

export async function adminRoutes(fastify: FastifyInstance) {
    fastify.register(backupRoutes);
}
