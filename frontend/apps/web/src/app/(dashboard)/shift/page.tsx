"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { shiftApi, facilityApi } from "@/lib/api";
import { formatIDR } from "@pz/shared";
import type { ShiftRecord, FacilityRecord } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function dur(openedAt: string, closedAt?: string | null): string {
  const start = new Date(openedAt).getTime();
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  const mins = Math.floor((end - start) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function varianceBadge(variance: number | string | null | undefined) {
  if (variance == null) return null;
  const v = Number(variance);
  if (Math.abs(v) < 1) return <Badge variant="success">Balanced</Badge>;
  if (v > 0) return <Badge variant="info">Overage +{formatIDR(v)}</Badge>;
  return <Badge variant="danger">Short {formatIDR(Math.abs(v))}</Badge>;
}

// ── Open Shift Modal ──────────────────────────────────────────────────────────

function OpenShiftModal({ facilities, onClose, onOpened }: {
  facilities: FacilityRecord[];
  onClose: () => void;
  onOpened: (shift: ShiftRecord) => void;
}) {
  const [cash, setCash] = useState("");
  const [facilityId, setFacilityId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleOpen = async () => {
    const amt = parseFloat(cash);
    if (isNaN(amt) || amt < 0) { setErr("Enter a valid opening cash amount (0 or more)."); return; }
    setSaving(true); setErr(null);
    try {
      const res = await shiftApi.openShift({
        openingCash: amt,
        facilityId: facilityId ? Number(facilityId) : null,
        notes: notes.trim() || null,
      });
      onOpened(res.data as ShiftRecord);
    } catch (e: any) {
      setErr(e.message || "Failed to open shift.");
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
  };

  return (
    <Modal>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🟢</span> Open Shift
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={lbl}>Opening Cash in Drawer (Rp) *</label>
          <input style={inp} type="number" min="0" value={cash}
            onChange={e => setCash(e.target.value)} placeholder="e.g. 500000" autoFocus />
          {cash && !isNaN(parseFloat(cash)) && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              = {formatIDR(parseFloat(cash))}
            </p>
          )}
        </div>
        <div>
          <label style={lbl}>Outlet / Facility</label>
          <select style={inp} value={facilityId} onChange={e => setFacilityId(e.target.value)}>
            <option value="">— All Outlets —</option>
            {facilities.map(f => <option key={f.id} value={f.id}>🏪 {f.facilityName}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Notes (optional)</label>
          <textarea style={{ ...inp, resize: "vertical", minHeight: "60px" }}
            value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opening note..." />
        </div>
        {err && <ErrBox>{err}</ErrBox>}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</Button>
          <Button style={{ flex: 1 }} onClick={handleOpen} disabled={saving}>
            {saving ? "Opening..." : "Open Shift"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Close Shift Modal ─────────────────────────────────────────────────────────

function CloseShiftModal({ shift, onClose, onClosed }: {
  shift: ShiftRecord;
  onClose: () => void;
  onClosed: (closed: ShiftRecord) => void;
}) {
  const [cash, setCash] = useState("");
  const [notes, setNotes] = useState(shift.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleClose = async () => {
    const amt = parseFloat(cash);
    if (isNaN(amt) || amt < 0) { setErr("Enter the actual cash counted in the drawer."); return; }
    setSaving(true); setErr(null);
    try {
      const res = await shiftApi.closeShift({ closingCash: amt, notes: notes.trim() || null });
      onClosed(res.data as ShiftRecord);
    } catch (e: any) {
      setErr(e.message || "Failed to close shift.");
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
  };

  return (
    <Modal>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🔴</span> Close Shift
      </h2>

      <div style={{
        padding: "0.85rem 1rem", borderRadius: "var(--radius-md)",
        backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)",
        marginBottom: "1.25rem", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "0.3rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>Opened at</span>
          <span style={{ color: "var(--text-secondary)" }}>{fmtTime(shift.openedAt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>Duration</span>
          <span style={{ color: "var(--text-secondary)" }}>{dur(shift.openedAt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-muted)" }}>Opening Cash</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatIDR(Number(shift.openingCash))}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={lbl}>Closing Cash Count (Rp) * — count the physical cash in the drawer</label>
          <input style={inp} type="number" min="0" value={cash}
            onChange={e => setCash(e.target.value)} placeholder="e.g. 750000" autoFocus />
          {cash && !isNaN(parseFloat(cash)) && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              = {formatIDR(parseFloat(cash))}
            </p>
          )}
        </div>
        <div>
          <label style={lbl}>Closing Notes (optional)</label>
          <textarea style={{ ...inp, resize: "vertical", minHeight: "60px" }}
            value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes for this shift..." />
        </div>
        {err && <ErrBox>{err}</ErrBox>}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</Button>
          <Button style={{ flex: 1, backgroundColor: saving ? undefined : "var(--accent-rose)" }}
            onClick={handleClose} disabled={saving}>
            {saving ? "Closing..." : "Close & Reconcile"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ShiftPage() {
  const [currentShift, setCurrentShift] = useState<ShiftRecord | null>(null);
  const [history, setHistory] = useState<ShiftRecord[]>([]);
  const [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [elapsed, setElapsed] = useState("");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [curr, hist, facs] = await Promise.all([
        shiftApi.getCurrentShift(),
        shiftApi.listShifts({ limit: 20, page: 1 }),
        facilityApi.getFacilities({ limit: 50 }),
      ]);
      setCurrentShift((curr.data as ShiftRecord) ?? null);
      setHistory(hist.items ?? []);
      const facData = (facs as any)?.data || (facs as any)?.items || [];
      setFacilities(facData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live elapsed clock for open shift
  useEffect(() => {
    if (!currentShift) { setElapsed(""); return; }
    const tick = () => setElapsed(dur(currentShift.openedAt));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [currentShift]);

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
          {toast.type === "success" ? "✓" : "✕"} {toast.text}
        </div>
      )}

      {showOpen && (
        <OpenShiftModal
          facilities={facilities}
          onClose={() => setShowOpen(false)}
          onOpened={shift => {
            setShowOpen(false);
            setCurrentShift(shift);
            showToast("Shift opened.");
            load();
          }}
        />
      )}

      {showClose && currentShift && (
        <CloseShiftModal
          shift={currentShift}
          onClose={() => setShowClose(false)}
          onClosed={closed => {
            setShowClose(false);
            setCurrentShift(null);
            showToast("Shift closed and reconciled.");
            load();
          }}
        />
      )}

      {/* Header */}
      <div style={{
        padding: "2rem 1.75rem", borderRadius: "var(--radius-lg)",
        background: "linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.85))",
        border: "1px solid var(--border-subtle)", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Badge variant={currentShift ? "success" : "default"}>
              {currentShift ? "🟢 Shift Open" : "⚫ No Active Shift"}
            </Badge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Shift & Cash Drawer
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.35rem", lineHeight: 1.5, maxWidth: "580px" }}>
                Open a shift to start the cash drawer, track sales by session, and reconcile cash at close.
              </p>
            </div>
            {!loading && (
              currentShift ? (
                <Button
                  onClick={() => setShowClose(true)}
                  style={{ backgroundColor: "var(--accent-rose)", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <span>🔴</span> Close Shift
                </Button>
              ) : (
                <Button
                  onClick={() => setShowOpen(true)}
                  style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <span>🟢</span> Open Shift
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Current Shift Status */}
      {loading ? (
        <Card style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</Card>
      ) : currentShift ? (
        <Card style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{
              width: "10px", height: "10px", borderRadius: "50%",
              backgroundColor: "var(--accent-emerald)",
              boxShadow: "0 0 8px var(--accent-emerald)",
              animation: "pulse 2s infinite",
            }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Active Shift</h2>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>({elapsed})</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            <ShiftStat label="Opened At" value={fmtTime(currentShift.openedAt)} />
            <ShiftStat label="Opening Cash" value={formatIDR(Number(currentShift.openingCash))} accent="var(--accent-blue)" />
            <ShiftStat label="Outlet" value={currentShift.facility?.facilityName ?? "All Outlets"} />
            <ShiftStat label="Opened By" value={currentShift.openedByUser?.name || currentShift.openedBy} />
          </div>
        </Card>
      ) : (
        <Card style={{ padding: "2.5rem", textAlign: "center" }}>
          <span style={{ fontSize: "2.5rem" }}>⚫</span>
          <p style={{ color: "var(--text-muted)", marginTop: "0.75rem" }}>No active shift. Open one to start tracking sales.</p>
        </Card>
      )}

      {/* Shift History */}
      {history.length > 0 && (
        <Card style={{ padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Recent Shifts</h2>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{history.length} shown</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  {["Date", "Outlet", "Cashier", "Duration", "Opening", "Closing", "Sales", "Orders", "Cash Variance"].map(h => (
                    <th key={h} style={{ padding: "0.65rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < history.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {fmtTime(s.openedAt)}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {s.facility?.facilityName ?? "—"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {s.openedByUser?.name || s.openedBy.slice(0, 8)}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {s.closedAt ? dur(s.openedAt, s.closedAt) : (
                        <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>Open</span>
                      )}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {formatIDR(Number(s.openingCash))}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {s.closingCash != null ? formatIDR(Number(s.closingCash)) : "—"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", color: "var(--accent-emerald)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {s.totalSales != null ? formatIDR(Number(s.totalSales)) : "—"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", color: "var(--text-secondary)", textAlign: "center" }}>
                      {s.totalOrders ?? "—"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {s.cashVariance != null ? varianceBadge(s.cashVariance) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment breakdown for closed shifts */}
          {history.filter(s => s.closedAt && s.totalSales != null).length > 0 && (
            <>
              <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>Last Closed Shift — Payment Breakdown</h3>
              </div>
              {(() => {
                const last = history.find(s => s.closedAt && s.totalSales != null);
                if (!last) return null;
                return (
                  <div style={{ padding: "1rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                    <PayBadge label="Cash" amount={Number(last.totalCash ?? 0)} color="var(--accent-emerald)" />
                    <PayBadge label="Card" amount={Number(last.totalCard ?? 0)} color="var(--accent-blue)" />
                    <PayBadge label="Bank Transfer" amount={Number(last.totalTransfer ?? 0)} color="var(--accent-amber)" />
                    <PayBadge label="E-Wallet" amount={Number(last.totalEwallet ?? 0)} color="var(--accent-violet, #8b5cf6)" />
                  </div>
                );
              })()}
            </>
          )}
        </Card>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <Card style={{ maxWidth: "460px", width: "100%", padding: "2rem" }}>{children}</Card>
    </div>
  );
}

function ErrBox({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: "var(--accent-rose)", fontSize: "0.82rem",
      padding: "0.5rem 0.75rem", backgroundColor: "rgba(239,68,68,0.08)",
      borderRadius: "var(--radius-sm)",
    }}>{children}</p>
  );
}

const lbl: React.CSSProperties = {
  fontSize: "0.78rem", color: "var(--text-secondary)", display: "block",
  marginBottom: "0.35rem", fontWeight: 600,
};

function ShiftStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: accent ?? "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function PayBadge({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div style={{
      padding: "0.75rem 1rem", borderRadius: "var(--radius-md)",
      backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)",
    }}>
      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>{label}</div>
      <div style={{ fontSize: "1rem", fontWeight: 700, color }}>{formatIDR(amount)}</div>
    </div>
  );
}
