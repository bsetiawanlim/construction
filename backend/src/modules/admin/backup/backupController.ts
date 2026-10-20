import { FastifyRequest, FastifyReply } from "fastify";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { AppError } from "../../../utils/errors";
import { success } from "../../../utils/response";

const BACKUP_DIR = path.resolve(process.cwd(), "backups");

function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

function parseDatabaseUrl(url: string) {
    const parsed = new URL(url);
    return {
        user: parsed.username,
        password: parsed.password,
        host: parsed.hostname,
        port: parsed.port || "5432",
        database: parsed.pathname.slice(1),
    };
}

function isSafeFilename(filename: string) {
    return filename.endsWith(".sql") && !filename.includes("..") && !filename.includes("/") && !filename.includes("\\");
}

export async function requireSuperAdmin(request: FastifyRequest, reply: FastifyReply) {
    if (!request.session?.user?.isSuperAdmin) {
        throw AppError.forbidden("Super admin access required.");
    }
}

export async function listBackups(request: FastifyRequest, reply: FastifyReply) {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith(".sql"))
        .map(f => {
            const filePath = path.join(BACKUP_DIR, f);
            const stat = fs.statSync(filePath);
            return { filename: f, size: stat.size, createdAt: stat.birthtime };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return success(reply, files, "Backup list retrieved.");
}

export async function createBackup(request: FastifyRequest, reply: FastifyReply) {
    ensureBackupDir();
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw AppError.internal("DATABASE_URL not configured.");

    const db = parseDatabaseUrl(dbUrl);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${timestamp}.sql`;
    const filePath = path.join(BACKUP_DIR, filename);

    await new Promise<void>((resolve, reject) => {
        const child = spawn("pg_dump", [
            "-h", db.host,
            "-p", db.port,
            "-U", db.user,
            "-d", db.database,
            "-f", filePath,
            "--no-password",
        ], { env: { ...process.env, PGPASSWORD: db.password } });

        let stderr = "";
        child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
        child.on("close", code => {
            if (code === 0) resolve();
            else reject(AppError.internal(`pg_dump failed (exit ${code}): ${stderr}`));
        });
        child.on("error", err => reject(AppError.internal(`pg_dump not found: ${err.message}. Ensure PostgreSQL client tools are installed.`)));
    });

    const stat = fs.statSync(filePath);
    return success(reply, { filename, size: stat.size, createdAt: stat.birthtime }, "Backup created successfully.");
}

export async function downloadBackup(
    request: FastifyRequest<{ Params: { filename: string } }>,
    reply: FastifyReply
) {
    const { filename } = request.params;
    if (!isSafeFilename(filename)) throw AppError.badRequest("Invalid filename.");
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) throw AppError.notFound("Backup file not found.");

    const stream = fs.createReadStream(filePath);
    reply.header("Content-Disposition", `attachment; filename="${filename}"`);
    reply.header("Content-Type", "application/octet-stream");
    return reply.send(stream);
}

export async function deleteBackup(
    request: FastifyRequest<{ Params: { filename: string } }>,
    reply: FastifyReply
) {
    const { filename } = request.params;
    if (!isSafeFilename(filename)) throw AppError.badRequest("Invalid filename.");
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) throw AppError.notFound("Backup file not found.");
    fs.unlinkSync(filePath);
    return success(reply, null, "Backup deleted.");
}

export async function restoreBackup(
    request: FastifyRequest<{ Params: { filename: string } }>,
    reply: FastifyReply
) {
    const { filename } = request.params;
    if (!isSafeFilename(filename)) throw AppError.badRequest("Invalid filename.");
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) throw AppError.notFound("Backup file not found.");

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw AppError.internal("DATABASE_URL not configured.");
    const db = parseDatabaseUrl(dbUrl);

    await new Promise<void>((resolve, reject) => {
        const child = spawn("psql", [
            "-h", db.host,
            "-p", db.port,
            "-U", db.user,
            "-d", db.database,
            "-f", filePath,
            "--no-password",
        ], { env: { ...process.env, PGPASSWORD: db.password } });

        let stderr = "";
        child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
        child.on("close", code => {
            if (code === 0) resolve();
            else reject(AppError.internal(`psql restore failed (exit ${code}): ${stderr}`));
        });
        child.on("error", err => reject(AppError.internal(`psql not found: ${err.message}. Ensure PostgreSQL client tools are installed.`)));
    });

    return success(reply, null, "Database restored successfully.");
}
