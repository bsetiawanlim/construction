"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { discountApi } from "@/lib/api";
import { formatIDR } from "@pz/shared";
import type { DiscountRecord, CreateDiscountInput, UpdateDiscountInput, DiscountType } from "@pz/shared";

// ── Helpers ───────────────────────────────────────────────────────────────────

function discountTypeBadge(type: DiscountType) {
  return type === "PERCENTAGE"
    ? <Badge variant="info">% Percentage</Badge>
    : <Badge variant="warning">Rp Fixed Amount</Badge>;
}

function discountValueLabel(d: DiscountRecord): string {
  const v = Number(d.value);
  if (d.discountType === "PERCENTAGE") return `${v}%`;
  return formatIDR(v);
}

function statusBadge(d: DiscountRecord) {
  const now = new Date();
  if (!d.isActive) return <Badge variant="danger">Inactive</Badge>;
  if (d.expiresAt && new Date(d.expiresAt) < now) return <Badge variant="danger">Expired</Badge>;
  if (d.startsAt && new Date(d.startsAt) > now) return <Badge variant="warning">Scheduled</Badge>;
  if (d.maxUsageCount != null && d.usageCount >= d.maxUsageCount) return <Badge variant="danger">Exhausted</Badge>;
  return <Badge variant="success">Active</Badge>;
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  initial?: DiscountRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

function DiscountModal({ initial, onClose, onSaved }: ModalProps) {
  const isEdit = !!initial;
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [type, setType] = useState<DiscountType>(initial?.discountType ?? "PERCENTAGE");
  const [value, setValue] = useState(String(initial?.value != null ? Number(initial.value) : ""));
  const [maxAmt, setMaxAmt] = useState(String(initial?.maxDiscountAmount != null ? Number(initial.maxDiscountAmount) : ""));
  const [minOrder, setMinOrder] = useState(String(initial?.minOrderAmount != null ? Number(initial.minOrderAmount) : ""));
  const [active, setActive] = useState(initial?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(initial?.startsAt ? initial.startsAt.slice(0, 16) : "");
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ? initial.expiresAt.slice(0, 16) : "");
  const [maxUsage, setMaxUsage] = useState(String(initial?.maxUsageCount ?? ""));

  const handleSave = async () => {
    if (!name.trim()) { setErr("Name is required."); return; }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) { setErr("Value must be a positive number."); return; }
    if (type === "PERCENTAGE" && Number(value) > 100) { setErr("Percentage cannot exceed 100."); return; }
    setErr(null);
    setSaving(true);
    try {
      if (isEdit && initial) {
        const input: UpdateDiscountInput = {
          id: initial.id,
          name: name.trim(),
          code: code.trim() || null,
          description: desc.trim() || null,
          discountType: type,
          value: Number(value),
          maxDiscountAmount: maxAmt ? Number(maxAmt) : null,
          minOrderAmount: minOrder ? Number(minOrder) : null,
          isActive: active,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          maxUsageCount: maxUsage ? Number(maxUsage) : null,
        };
        await discountApi.updateDiscount(input);
      } else {
        const input: CreateDiscountInput = {
          name: name.trim(),
          code: code.trim() || null,
          description: desc.trim() || null,
          discountType: type,
          value: Number(value),
          maxDiscountAmount: maxAmt ? Number(maxAmt) : null,
          minOrderAmount: minOrder ? Number(minOrder) : null,
          isActive: active,
          startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          maxUsageCount: maxUsage ? Number(maxUsage) : null,
        };
        await discountApi.createDiscount(input);
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.55rem 0.8rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "0.78rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem", fontWeight: 600,
  };
  const rowStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <Card style={{ maxWidth: "520px", width: "100%", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>
          {isEdit ? "Edit Discount" : "New Discount / Promo"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={rowStyle}>
            <label style={labelStyle}>Name *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekend Special" />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Promo Code <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(leave blank for auto-apply)</span></label>
            <input style={inputStyle} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. CAFE10" />
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
              value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional internal note" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Discount Type *</label>
              <select style={inputStyle} value={type} onChange={e => setType(e.target.value as DiscountType)}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount (Rp)</option>
              </select>
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Value * {type === "PERCENTAGE" ? "(0-100)" : "(Rp)"}</label>
              <input style={inputStyle} type="number" min="0" value={value} onChange={e => setValue(e.target.value)} placeholder={type === "PERCENTAGE" ? "10" : "5000"} />
            </div>
          </div>

          {type === "PERCENTAGE" && (
            <div style={rowStyle}>
              <label style={labelStyle}>Max Discount Cap (Rp) <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
              <input style={inputStyle} type="number" min="0" value={maxAmt} onChange={e => setMaxAmt(e.target.value)} placeholder="e.g. 50000" />
            </div>
          )}

          <div style={rowStyle}>
            <label style={labelStyle}>Minimum Order Amount (Rp) <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
            <input style={inputStyle} type="number" min="0" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="e.g. 100000" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Starts At <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
              <input style={inputStyle} type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Expires At <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
              <input style={inputStyle} type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Max Total Uses <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(leave blank for unlimited)</span></label>
            <input style={inputStyle} type="number" min="1" value={maxUsage} onChange={e => setMaxUsage(e.target.value)} placeholder="e.g. 100" />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} style={{ width: "16px", height: "16px" }} />
            <span style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>Active</span>
          </label>

          {err && (
            <p style={{ color: "var(--accent-rose)", fontSize: "0.82rem", padding: "0.5rem 0.75rem", backgroundColor: "rgba(239,68,68,0.08)", borderRadius: "var(--radius-sm)" }}>
              {err}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <Button variant="secondary" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</Button>
            <Button style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Discount"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DiscountRecord | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await discountApi.listDiscounts({ limit: 200, page: 1 });
      setDiscounts(res.items ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load discounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = discounts.filter(d => {
    const q = search.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || (d.code || "").toLowerCase().includes(q);
  });

  const handleDelete = async (d: DiscountRecord) => {
    if (!confirm(`Delete discount "${d.name}"?`)) return;
    setDeletingId(d.id);
    try {
      await discountApi.deleteDiscount(d.id);
      showToast("Discount deleted.");
      setDiscounts(prev => prev.filter(x => x.id !== d.id));
    } catch (e: any) {
      showToast(e.message || "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = discounts.filter(d => {
    const now = new Date();
    return d.isActive && (!d.expiresAt || new Date(d.expiresAt) >= now);
  }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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

      {(modalOpen || editTarget) && (
        <DiscountModal
          initial={editTarget}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          onSaved={() => {
            setModalOpen(false);
            setEditTarget(null);
            showToast(editTarget ? "Discount updated." : "Discount created.");
            load();
          }}
        />
      )}

      {/* Header */}
      <div style={{
        padding: "2rem 1.75rem",
        borderRadius: "var(--radius-lg)",
        background: "linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.85))",
        border: "1px solid var(--border-subtle)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Badge variant="success">🏷️ Promotions</Badge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Discounts & Promos
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.35rem", lineHeight: 1.5, maxWidth: "580px" }}>
                Create percentage or fixed-amount discounts with promo codes, date ranges, and usage limits. Apply at POS checkout.
              </p>
            </div>
            <Button onClick={() => { setEditTarget(null); setModalOpen(true); }}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
              <span>＋</span><span>New Discount</span>
            </Button>
          </div>
          {!loading && (
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              <StatChip label="Total" value={discounts.length} color="var(--accent-blue)" />
              <StatChip label="Active" value={activeCount} color="var(--accent-emerald)" />
              <StatChip label="With Code" value={discounts.filter(d => d.code).length} color="var(--accent-amber)" />
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or promo code..."
            style={{
              width: "100%", padding: "0.6rem 0.85rem 0.6rem 2.25rem",
              borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-surface)", color: "var(--text-primary)",
              fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
          {loading ? "..." : `${filtered.length} discount${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <Card style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</Card>
      ) : error ? (
        <Card style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--accent-rose)" }}>{error}</p>
          <Button variant="secondary" size="sm" onClick={load} style={{ marginTop: "1rem" }}>Retry</Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ fontSize: "2.5rem" }}>🏷️</p>
          <p style={{ color: "var(--text-muted)", marginTop: "0.75rem" }}>
            {search ? "No discounts match your search." : "No discounts yet. Create your first promo."}
          </p>
        </Card>
      ) : (
        <Card style={{ padding: "0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                {["Name / Code", "Type", "Value", "Min. Order", "Validity", "Uses", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <td style={{ padding: "0.9rem 1rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{d.name}</div>
                    {d.code && (
                      <code style={{
                        fontSize: "0.72rem", backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)", padding: "0.1rem 0.4rem",
                        borderRadius: "var(--radius-sm)", color: "var(--accent-amber)", marginTop: "0.2rem", display: "inline-block",
                      }}>{d.code}</code>
                    )}
                  </td>
                  <td style={{ padding: "0.9rem 1rem" }}>{discountTypeBadge(d.discountType)}</td>
                  <td style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--accent-emerald)", fontSize: "0.9rem" }}>
                    {discountValueLabel(d)}
                    {d.maxDiscountAmount && d.discountType === "PERCENTAGE" && (
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                        cap {formatIDR(Number(d.maxDiscountAmount))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "0.9rem 1rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {d.minOrderAmount ? formatIDR(Number(d.minOrderAmount)) : "None"}
                  </td>
                  <td style={{ padding: "0.9rem 1rem", fontSize: "0.78rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    <div>{fmt(d.startsAt)} →</div>
                    <div>{fmt(d.expiresAt)}</div>
                  </td>
                  <td style={{ padding: "0.9rem 1rem", fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {d.usageCount}{d.maxUsageCount != null ? ` / ${d.maxUsageCount}` : " / ∞"}
                  </td>
                  <td style={{ padding: "0.9rem 1rem" }}>{statusBadge(d)}</td>
                  <td style={{ padding: "0.9rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => setEditTarget(d)}
                        style={{ padding: "0.3rem 0.65rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.78rem" }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(d)}
                        disabled={deletingId === d.id}
                        style={{ padding: "0.3rem 0.65rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "var(--accent-rose)", cursor: "pointer", fontSize: "0.78rem" }}>
                        {deletingId === d.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
      <span style={{ fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}
