"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { scheduleApi, employeeApi, facilityApi } from "@/lib/api";
import type { ScheduleRecord, CreateScheduleInput, UpdateScheduleInput, EmployeeRecord, FacilityRecord } from "@/lib/api";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// 10 distinct hues for employee color coding
const EMPLOYEE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#6366f1",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtHeader(d: Date): string {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function fmtWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
  return `${monday.toLocaleDateString("id-ID", opts)} – ${sunday.toLocaleDateString("id-ID", opts)}`;
}

function empName(e?: ScheduleRecord["employee"]): string {
  if (!e?.profile) return `Employee #${e?.id ?? "?"}`;
  return [e.profile.firstName, e.profile.lastName].filter(Boolean).join(" ");
}

function minutesFromTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function shiftHours(start: string, end: string): string {
  const diff = minutesFromTime(end) - minutesFromTime(start);
  if (diff <= 0) return "—";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

interface ModalProps {
  initial?: ScheduleRecord | null;
  defaultDate?: string;
  employees: EmployeeRecord[];
  facilities: FacilityRecord[];
  onClose: () => void;
  onSaved: () => void;
}

function ScheduleModal({ initial, defaultDate, employees, facilities, onClose, onSaved }: ModalProps) {
  const isEdit = !!initial;
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState(String(initial?.employeeId ?? ""));
  const [date, setDate] = useState(initial ? toYMD(new Date(initial.scheduleDate)) : (defaultDate ?? ""));
  const [startTime, setStartTime] = useState(initial?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "17:00");
  const [facilityId, setFacilityId] = useState(String(initial?.facilityId ?? ""));
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const handleSave = async () => {
    if (!employeeId) { setErr("Select an employee."); return; }
    if (!date) { setErr("Select a date."); return; }
    if (!startTime || !endTime) { setErr("Set start and end time."); return; }
    if (minutesFromTime(startTime) >= minutesFromTime(endTime)) {
      setErr("End time must be after start time."); return;
    }
    setSaving(true); setErr(null);
    try {
      if (isEdit && initial) {
        const input: UpdateScheduleInput = {
          id: initial.id,
          scheduleDate: date,
          startTime,
          endTime,
          facilityId: facilityId ? Number(facilityId) : null,
          notes: notes.trim() || null,
        };
        await scheduleApi.updateSchedule(input);
      } else {
        const input: CreateScheduleInput = {
          employeeId: Number(employeeId),
          scheduleDate: date,
          startTime,
          endTime,
          facilityId: facilityId ? Number(facilityId) : null,
          notes: notes.trim() || null,
        };
        await scheduleApi.createSchedule(input);
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.55rem 0.8rem", borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
  };
  const rowStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <Card style={{ maxWidth: "480px", width: "100%", padding: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          {isEdit ? "Edit Schedule" : "Add Schedule"}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <div style={rowStyle}>
            <label style={lbl}>Employee *</label>
            <select style={inp} value={employeeId} onChange={e => setEmployeeId(e.target.value)} disabled={isEdit}>
              <option value="">— Select employee —</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.profile ? `${emp.profile.firstName} ${emp.profile.lastName ?? ""}`.trim() : `Employee #${emp.id}`}
                  {emp.position ? ` (${emp.position.name})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div style={rowStyle}>
            <label style={lbl}>Date *</label>
            <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={rowStyle}>
              <label style={lbl}>Start Time *</label>
              <input style={inp} type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div style={rowStyle}>
              <label style={lbl}>End Time *</label>
              <input style={inp} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          {startTime && endTime && minutesFromTime(startTime) < minutesFromTime(endTime) && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "-0.4rem" }}>
              Duration: {shiftHours(startTime, endTime)}
            </p>
          )}
          <div style={rowStyle}>
            <label style={lbl}>Outlet (optional)</label>
            <select style={inp} value={facilityId} onChange={e => setFacilityId(e.target.value)}>
              <option value="">— All Outlets —</option>
              {facilities.map(f => <option key={f.id} value={f.id}>🏪 {f.facilityName}</option>)}
            </select>
          </div>
          <div style={rowStyle}>
            <label style={lbl}>Notes (optional)</label>
            <textarea style={{ ...inp, resize: "vertical", minHeight: "56px" }}
              value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." />
          </div>
          {err && (
            <p style={{ fontSize: "0.82rem", color: "var(--accent-rose)", padding: "0.5rem 0.75rem", backgroundColor: "rgba(239,68,68,0.08)", borderRadius: "var(--radius-sm)" }}>
              {err}
            </p>
          )}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button variant="secondary" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</Button>
            <Button style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add to Schedule"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [monday, setMonday] = useState<Date>(() => getMondayOf(new Date()));
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; record?: ScheduleRecord | null; defaultDate?: string }>({ open: false });
  const [toast, setToast] = useState<string | null>(null);
  const [filterEmp, setFilterEmp] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async (mon: Date) => {
    setLoading(true);
    try {
      const [schRes, empRes, facRes] = await Promise.all([
        scheduleApi.listSchedules({ weekStart: toYMD(mon), limit: 200 }),
        employeeApi.listEmployees({ limit: 100 }),
        facilityApi.getFacilities({ limit: 50 }),
      ]);
      setSchedules(schRes.items ?? []);
      setEmployees((empRes as any)?.items ?? (empRes as any)?.data ?? []);
      const facData = (facRes as any)?.data || (facRes as any)?.items || [];
      setFacilities(facData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(monday); }, [monday, load]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);

  // Map: dateString → ScheduleRecord[]
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleRecord[]>();
    for (const s of schedules) {
      const key = toYMD(new Date(s.scheduleDate));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [schedules]);

  // Assign stable colors to employees
  const empColors = useMemo(() => {
    const colors = new Map<number, string>();
    employees.forEach((e, i) => colors.set(e.id, EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length]!));
    return colors;
  }, [employees]);

  // Unique employees with schedules this week
  const activeEmployees = useMemo(() => {
    const ids = new Set(schedules.map(s => s.employeeId));
    return employees.filter(e => ids.has(e.id));
  }, [schedules, employees]);

  const filtered = useMemo(() => {
    if (!filterEmp) return scheduleMap;
    const empId = Number(filterEmp);
    const m = new Map<string, ScheduleRecord[]>();
    for (const [date, items] of scheduleMap) {
      const f = items.filter(s => s.employeeId === empId);
      if (f.length) m.set(date, f);
    }
    return m;
  }, [scheduleMap, filterEmp]);

  const totalHours = useMemo(() => {
    let total = 0;
    for (const s of schedules) {
      const diff = minutesFromTime(s.endTime) - minutesFromTime(s.startTime);
      if (diff > 0) total += diff;
    }
    return (total / 60).toFixed(1);
  }, [schedules]);

  const handleDelete = async (s: ScheduleRecord) => {
    if (!confirm(`Remove schedule for ${empName(s.employee)} on ${toYMD(new Date(s.scheduleDate))}?`)) return;
    setDeletingId(s.id);
    try {
      await scheduleApi.deleteSchedule(s.id);
      setSchedules(prev => prev.filter(x => x.id !== s.id));
      showToast("Schedule removed.");
    } catch (e: any) {
      showToast(e.message || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const today = toYMD(new Date());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
          padding: "0.75rem 1.25rem", borderRadius: "var(--radius-md)",
          backgroundColor: "var(--bg-surface-elevated)", border: "1px solid var(--accent-emerald)",
          color: "var(--text-primary)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          fontSize: "0.85rem", fontWeight: 600,
        }}>
          ✓ {toast}
        </div>
      )}

      {modal.open && (
        <ScheduleModal
          initial={modal.record}
          defaultDate={modal.defaultDate}
          employees={employees}
          facilities={facilities}
          onClose={() => setModal({ open: false })}
          onSaved={() => {
            setModal({ open: false });
            showToast(modal.record ? "Schedule updated." : "Schedule added.");
            load(monday);
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
            <Badge variant="info">📅 HR</Badge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Employee Schedule
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.35rem", lineHeight: 1.5, maxWidth: "560px" }}>
                Weekly roster view — assign shifts to employees, track working hours, and plan staffing per outlet.
              </p>
            </div>
            <Button onClick={() => setModal({ open: true })}
              style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <span>＋</span> Add Shift
            </Button>
          </div>
          {!loading && (
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              <StatChip label="Shifts This Week" value={String(schedules.length)} color="var(--accent-blue)" />
              <StatChip label="Staff on Roster" value={String(activeEmployees.length)} color="var(--accent-emerald)" />
              <StatChip label="Total Hours" value={`${totalHours}h`} color="var(--accent-amber)" />
            </div>
          )}
        </div>
      </div>

      {/* Week Navigator + Filter */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => setMonday(m => addDays(m, -7))} style={navBtn}>◀</button>
          <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
            {fmtWeekRange(monday)}
          </span>
          <button onClick={() => setMonday(m => addDays(m, 7))} style={navBtn}>▶</button>
          <button onClick={() => setMonday(getMondayOf(new Date()))} style={{ ...navBtn, fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}>
            Today
          </button>
        </div>
        <div style={{ flex: 1, minWidth: "180px" }}>
          <select
            value={filterEmp}
            onChange={e => setFilterEmp(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", width: "100%",
            }}
          >
            <option value="">All Employees</option>
            {activeEmployees.map(e => (
              <option key={e.id} value={e.id}>
                {e.profile ? `${e.profile.firstName} ${e.profile.lastName ?? ""}`.trim() : `Employee #${e.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Grid */}
      {loading ? (
        <Card style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading schedule...</Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
          {weekDays.map((day, i) => {
            const ymd = toYMD(day);
            const isToday = ymd === today;
            const daySchedules = (filtered.get(ymd) ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={ymd} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {/* Day header */}
                <div style={{
                  padding: "0.6rem 0.5rem", borderRadius: "var(--radius-md)",
                  backgroundColor: isToday ? "rgba(59,130,246,0.15)" : "var(--bg-surface)",
                  border: isToday ? "1px solid rgba(59,130,246,0.4)" : "1px solid var(--border-subtle)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: isToday ? "var(--accent-blue)" : "var(--text-muted)", textTransform: "uppercase" }}>
                    {DAYS[i]}
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: isToday ? "var(--accent-blue)" : "var(--text-primary)", marginTop: "0.15rem" }}>
                    {fmtHeader(day)}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    {daySchedules.length > 0 ? `${daySchedules.length} shift${daySchedules.length !== 1 ? "s" : ""}` : "Off"}
                  </div>
                </div>

                {/* Shift blocks */}
                {daySchedules.map(s => {
                  const color = empColors.get(s.employeeId) ?? "#6366f1";
                  return (
                    <div key={s.id} style={{
                      padding: "0.5rem 0.6rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: `${color}18`,
                      border: `1px solid ${color}40`,
                      position: "relative",
                    }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color, marginBottom: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {empName(s.employee)}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        {s.startTime} – {s.endTime}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                        {shiftHours(s.startTime, s.endTime)}
                        {s.facility && ` · ${s.facility.facilityName}`}
                      </div>
                      {s.notes && (
                        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.15rem", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.notes}
                        </div>
                      )}
                      {/* Action buttons on hover via inline buttons */}
                      <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.35rem" }}>
                        <button onClick={() => setModal({ open: true, record: s })}
                          style={{ flex: 1, padding: "0.2rem 0", borderRadius: "var(--radius-sm)", border: `1px solid ${color}40`, background: `${color}18`, color, cursor: "pointer", fontSize: "0.65rem", fontWeight: 600 }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(s)}
                          disabled={deletingId === s.id}
                          style={{ padding: "0.2rem 0.4rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "var(--accent-rose)", cursor: "pointer", fontSize: "0.65rem" }}>
                          {deletingId === s.id ? "…" : "✕"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add slot */}
                <button
                  onClick={() => setModal({ open: true, defaultDate: ymd })}
                  style={{
                    padding: "0.4rem", borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--border-subtle)", background: "transparent",
                    color: "var(--text-muted)", cursor: "pointer", fontSize: "0.72rem",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                >
                  + add
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {!loading && activeEmployees.length > 0 && (
        <Card style={{ padding: "1rem 1.25rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Employee Legend
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {activeEmployees.map(e => {
              const color = empColors.get(e.id) ?? "#6366f1";
              const name = e.profile ? `${e.profile.firstName} ${e.profile.lastName ?? ""}`.trim() : `#${e.id}`;
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{name}</span>
                  {e.position && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>({e.position.name})</span>}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
      <span style={{ fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

const lbl: React.CSSProperties = {
  fontSize: "0.78rem", color: "var(--text-secondary)", display: "block",
  marginBottom: "0.3rem", fontWeight: 600,
};

const navBtn: React.CSSProperties = {
  padding: "0.35rem 0.75rem", borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-subtle)", background: "var(--bg-surface)",
  color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem",
};
