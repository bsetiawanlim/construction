"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { apiClient } from "@/lib/api";

interface BackupFile {
    filename: string;
    size: number;
    createdAt: string;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function BackupPage() {
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
    const [confirmText, setConfirmText] = useState("");
    const [restoring, setRestoring] = useState(false);
    const [deletingFile, setDeletingFile] = useState<string | null>(null);
    const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

    const showToast = (text: string, type: "success" | "error" = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchBackups = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get<BackupFile[]>("/api/admin/backups");
            setBackups(res.data ?? []);
        } catch (e: any) {
            setError(e.message || "Failed to load backups.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBackups(); }, [fetchBackups]);

    const handleCreate = async () => {
        try {
            setCreating(true);
            await apiClient.post("/api/admin/backups");
            showToast("Backup created successfully.");
            await fetchBackups();
        } catch (e: any) {
            showToast(e.message || "Failed to create backup.", "error");
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            const res = await apiClient.raw(`/api/admin/backups/${encodeURIComponent(filename)}/download`);
            if (!res.ok) throw new Error("Download failed.");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e: any) {
            showToast(e.message || "Download failed.", "error");
        }
    };

    const handleDelete = async (filename: string) => {
        try {
            setDeletingFile(filename);
            const res = await apiClient.raw(`/api/admin/backups/${encodeURIComponent(filename)}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed.");
            showToast("Backup deleted.");
            setBackups(prev => prev.filter(b => b.filename !== filename));
        } catch (e: any) {
            showToast(e.message || "Failed to delete backup.", "error");
        } finally {
            setDeletingFile(null);
        }
    };

    const handleRestore = async () => {
        if (!restoreTarget || confirmText !== "RESTORE") return;
        try {
            setRestoring(true);
            await apiClient.post(`/api/admin/backups/${encodeURIComponent(restoreTarget)}/restore`);
            showToast("Database restored successfully.");
            setRestoreTarget(null);
            setConfirmText("");
        } catch (e: any) {
            showToast(e.message || "Restore failed.", "error");
        } finally {
            setRestoring(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "960px", margin: "0 auto" }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
                    padding: "0.75rem 1.25rem", borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--bg-surface-elevated)",
                    border: `1px solid ${toast.type === "success" ? "var(--accent-emerald)" : "var(--accent-rose)"}`,
                    color: "var(--text-primary)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem",
                }}>
                    <span>{toast.type === "success" ? "✓" : "✕"}</span>
                    <span>{toast.text}</span>
                </div>
            )}

            {/* Restore Confirmation Modal */}
            {restoreTarget && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9000,
                    backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
                }}>
                    <Card style={{ maxWidth: "480px", width: "100%", padding: "2rem", border: "1px solid var(--accent-rose)" }}>
                        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                            <span style={{ fontSize: "2.5rem" }}>⚠️</span>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-rose)", marginTop: "0.75rem" }}>
                                Restore Database
                            </h2>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.5rem", lineHeight: 1.6 }}>
                                This will overwrite the current database with:
                            </p>
                            <code style={{
                                display: "block", marginTop: "0.5rem", padding: "0.4rem 0.75rem",
                                backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-sm)",
                                fontSize: "0.8rem", color: "var(--accent-amber)", wordBreak: "break-all",
                            }}>
                                {restoreTarget}
                            </code>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.75rem", lineHeight: 1.5 }}>
                                All current data will be replaced. This cannot be undone.
                            </p>
                        </div>
                        <div style={{ marginBottom: "1.25rem" }}>
                            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                                Type <strong style={{ color: "var(--text-primary)" }}>RESTORE</strong> to confirm:
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value)}
                                placeholder="RESTORE"
                                autoFocus
                                style={{
                                    width: "100%", padding: "0.6rem 0.85rem",
                                    borderRadius: "var(--radius-md)",
                                    border: `1px solid ${confirmText === "RESTORE" ? "var(--accent-rose)" : "var(--border-subtle)"}`,
                                    backgroundColor: "var(--bg-surface)", color: "var(--text-primary)",
                                    fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
                                    transition: "border-color var(--transition-fast)",
                                }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <Button
                                variant="secondary"
                                style={{ flex: 1 }}
                                onClick={() => { setRestoreTarget(null); setConfirmText(""); }}
                                disabled={restoring}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={confirmText !== "RESTORE" || restoring}
                                style={{
                                    flex: 1,
                                    backgroundColor: confirmText === "RESTORE" ? "var(--accent-rose)" : undefined,
                                    opacity: confirmText !== "RESTORE" ? 0.5 : 1,
                                }}
                                onClick={handleRestore}
                            >
                                {restoring ? "Restoring..." : "Restore Database"}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Header Banner */}
            <div style={{
                padding: "2rem 1.75rem",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.85))",
                border: "1px solid var(--border-subtle)",
                position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                        <Badge variant="warning">🗄️ System Admin</Badge>
                        <Badge variant="default">Super Admin Only</Badge>
                    </div>
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        flexWrap: "wrap", gap: "1rem",
                    }}>
                        <div>
                            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                                Database Backup
                            </h1>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.35rem", lineHeight: 1.5, maxWidth: "640px" }}>
                                Create and manage PostgreSQL database backups. Download them locally or restore the database to a previous state.
                            </p>
                        </div>
                        <Button
                            onClick={handleCreate}
                            disabled={creating}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}
                        >
                            <span>{creating ? "⏳" : "💾"}</span>
                            <span>{creating ? "Creating Backup..." : "New Backup"}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Backup List */}
            <Card style={{ padding: "0", overflow: "hidden" }}>
                <div style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid var(--border-subtle)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        Saved Backups
                    </h2>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {loading ? "..." : `${backups.length} file${backups.length !== 1 ? "s" : ""}`}
                    </span>
                </div>

                {loading ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        Loading backups...
                    </div>
                ) : error ? (
                    <div style={{ padding: "2rem", textAlign: "center" }}>
                        <span style={{ fontSize: "1.5rem" }}>⚠️</span>
                        <p style={{ color: "var(--accent-rose)", marginTop: "0.5rem", fontSize: "0.9rem" }}>{error}</p>
                        <Button variant="secondary" size="sm" onClick={fetchBackups} style={{ marginTop: "1rem" }}>
                            Retry
                        </Button>
                    </div>
                ) : backups.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center" }}>
                        <span style={{ fontSize: "2.5rem" }}>📭</span>
                        <p style={{ color: "var(--text-muted)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
                            No backups yet. Click "New Backup" to create one.
                        </p>
                    </div>
                ) : (
                    <div>
                        {backups.map((backup, i) => (
                            <div key={backup.filename} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "1rem 1.5rem", gap: "1rem", flexWrap: "wrap",
                                borderBottom: i < backups.length - 1 ? "1px solid var(--border-subtle)" : "none",
                                transition: "background-color var(--transition-fast)",
                            }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{
                                        fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)",
                                        fontFamily: "monospace",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {backup.filename}
                                    </p>
                                    <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                                        {formatBytes(backup.size)} &middot; {new Date(backup.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleDownload(backup.filename)}
                                        style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                                    >
                                        <span>⬇️</span>
                                        <span>Download</span>
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => { setRestoreTarget(backup.filename); setConfirmText(""); }}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: "0.3rem",
                                            color: "var(--accent-amber)", borderColor: "rgba(245,158,11,0.3)",
                                        }}
                                    >
                                        <span>🔄</span>
                                        <span>Restore</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={deletingFile === backup.filename}
                                        onClick={() => handleDelete(backup.filename)}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: "0.3rem",
                                            color: "var(--accent-rose)",
                                        }}
                                    >
                                        <span>{deletingFile === backup.filename ? "⏳" : "🗑️"}</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Info Box */}
            <Card style={{
                padding: "1.25rem",
                border: "1px solid rgba(245,158,11,0.2)",
                backgroundColor: "rgba(245,158,11,0.04)",
            }}>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.2rem", flexShrink: 0, marginTop: "0.1rem" }}>ℹ️</span>
                    <div>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-amber)", marginBottom: "0.35rem" }}>
                            Backup Notes
                        </p>
                        <ul style={{
                            fontSize: "0.82rem", color: "var(--text-secondary)",
                            lineHeight: 1.65, paddingLeft: "1.1rem", margin: 0,
                        }}>
                            <li>Backups use <code>pg_dump</code> and are stored in the <code>backups/</code> folder on the server.</li>
                            <li>Restore uses <code>psql</code> — it overwrites the current database. Always download a fresh backup first.</li>
                            <li>Download and store backups off-server regularly for disaster recovery.</li>
                            <li>Requires <code>pg_dump</code> and <code>psql</code> to be installed and available in the server's PATH.</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
}
