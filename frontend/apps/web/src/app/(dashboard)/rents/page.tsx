"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { equipmentApi } from "@/lib/api";
import { formatIDR } from "@pz/shared";
import { useDevice } from "@/lib/useDevice";
import type { EquipmentEntityRecord, EquipmentPriceRecord, EquipmentPriceType } from "@pz/shared";

export default function EquipmentRentsPage() {
  const device = useDevice();
  const [equipmentList, setEquipmentList] = useState<EquipmentEntityRecord[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [prices, setPrices] = useState<EquipmentPriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [priceTypeFilter, setPriceTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Add/Edit price modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<EquipmentPriceRecord | null>(null);
  const [priceType, setPriceType] = useState<EquipmentPriceType>("LEASE_DAILY");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Load equipment fleet
  useEffect(() => {
    async function loadEquipment() {
      try {
        setLoading(true);
        const res = await equipmentApi.listEquipment({ limit: 100 });
        const items = res.items || [];
        setEquipmentList(items);
        if (items.length > 0 && items[0] && !selectedEquipmentId) {
          setSelectedEquipmentId(items[0].id);
        }
      } catch (err) {
        console.error("Failed to load equipment assets:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEquipment();
  }, []);

  // Load prices for selected equipment
  useEffect(() => {
    if (!selectedEquipmentId) {
      setPrices([]);
      return;
    }
    async function loadPrices() {
      try {
        setPricesLoading(true);
        const res = await equipmentApi.getEquipmentPrices(selectedEquipmentId!);
        setPrices(res.data || []);
      } catch (err) {
        console.error("Failed to load equipment prices:", err);
        setPrices([]);
      } finally {
        setPricesLoading(false);
      }
    }
    loadPrices();
  }, [selectedEquipmentId]);

  const selectedEquipment = useMemo(() => {
    return equipmentList.find((e) => e.id === selectedEquipmentId);
  }, [equipmentList, selectedEquipmentId]);

  const filteredEquipment = useMemo(() => {
    if (!search) return equipmentList;
    return equipmentList.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.code && e.code.toLowerCase().includes(search.toLowerCase()))
    );
  }, [equipmentList, search]);

  const filteredPrices = useMemo(() => {
    if (priceTypeFilter === "ALL") return prices;
    return prices.filter((p) => p.priceType === priceTypeFilter);
  }, [prices, priceTypeFilter]);

  const handleOpenAddModal = () => {
    setEditingPrice(null);
    setPriceType("LEASE_DAILY");
    setAmount("");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: EquipmentPriceRecord) => {
    setEditingPrice(p);
    setPriceType(p.priceType || "LEASE_DAILY");
    setAmount(String(p.amount || ""));
    setNotes(p.notes || "");
    setIsModalOpen(true);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId || !amount) return;

    try {
      setIsSaving(true);
      if (editingPrice) {
        await equipmentApi.updateEquipmentPrice({
          id: editingPrice.id,
          equipmentEntityId: selectedEquipmentId,
          priceType,
          amount: parseFloat(amount),
          currency: "IDR",
          notes,
        });
      } else {
        await equipmentApi.createEquipmentPrice({
          equipmentEntityId: selectedEquipmentId,
          priceType,
          amount: parseFloat(amount),
          currency: "IDR",
          startDate: new Date().toISOString(),
          notes,
        });
      }

      // Reload prices
      const updated = await equipmentApi.getEquipmentPrices(selectedEquipmentId);
      setPrices(updated.data || []);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save rental price:", err);
      alert("Failed to save price record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrice = async (id: number) => {
    if (!confirm("Are you sure you want to delete this rental price tier?")) return;
    try {
      await equipmentApi.deleteEquipmentPrice(id);
      setPrices((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete price:", err);
      alert("Failed to delete price record.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div
        style={{
          padding: device.isSmallScreen ? "1.25rem 1rem" : "1.75rem 1.5rem",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: device.isSmallScreen ? "flex-start" : "center",
          flexDirection: device.isSmallScreen ? "column" : "row",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <Badge variant="warning">Transaction Module</Badge>
            <Badge variant="success">Fleet Hire</Badge>
          </div>
          <h1 style={{ fontSize: device.isSmallScreen ? "1.4rem" : "1.85rem", fontWeight: 800, color: "var(--text-primary)" }}>
            🔑 Equipment Rents & Leases
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem", maxWidth: "680px" }}>
            Manage commercial equipment rental rates, daily hire tariffs, and monthly lease contracts across your fleet.
          </p>
        </div>

        {selectedEquipmentId && (
          <Button onClick={handleOpenAddModal} id="btn-add-rental-rate">
            + Add Rental Rate
          </Button>
        )}
      </div>

      {/* Two Pane Layout: Fleet Asset Selector & Rental Rates Table */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: device.isSmallScreen ? "1fr" : "320px 1fr",
          gap: "1.25rem",
          alignItems: "flex-start",
        }}
      >
        {/* Left Column: Asset Selector */}
        <Card style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Fleet Machinery ({equipmentList.length})
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
              Select an asset to view and manage rental price tiers.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: "0.82rem",
            }}
          />

          <div
            className="custom-scrollbar"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              maxHeight: "520px",
              overflowY: "auto",
            }}
          >
            {loading ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem" }}>
                Loading equipment...
              </p>
            ) : filteredEquipment.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1.5rem" }}>
                No equipment assets found.
              </p>
            ) : (
              filteredEquipment.map((eq) => {
                const isSelected = eq.id === selectedEquipmentId;
                return (
                  <button
                    key={eq.id}
                    id={`asset-select-${eq.id}`}
                    onClick={() => setSelectedEquipmentId(eq.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "var(--radius-md)",
                      border: isSelected ? "1px solid var(--border-glow)" : "1px solid var(--border-subtle)",
                      backgroundColor: isSelected ? "var(--bg-surface-elevated)" : "transparent",
                      color: isSelected ? "var(--primary)" : "var(--text-secondary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: isSelected ? 700 : 500 }}>
                        {eq.name}
                      </p>
                      {eq.code && (
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Code: {eq.code}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "1.1rem" }}>🚜</span>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Column: Pricing Tiers Table */}
        <Card style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {selectedEquipment ? `Pricing Tiers for: ${selectedEquipment.name}` : "Select an Asset"}
              </h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {prices.length} price {prices.length === 1 ? "tier" : "tiers"} registered
              </span>
            </div>

            {/* Filter Pills */}
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {["ALL", "LEASE_DAILY", "LEASE_MONTHLY", "LEASE_YEARLY", "SALE"].map((type) => (
                <button
                  key={type}
                  onClick={() => setPriceTypeFilter(type)}
                  style={{
                    padding: "0.3rem 0.65rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: priceTypeFilter === type ? "1px solid var(--border-glow)" : "1px solid var(--border-subtle)",
                    backgroundColor: priceTypeFilter === type ? "var(--bg-surface-elevated)" : "transparent",
                    color: priceTypeFilter === type ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  {type.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {pricesLoading ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "2.5rem" }}>
              Loading rental prices...
            </p>
          ) : filteredPrices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
              <span style={{ fontSize: "2.5rem" }}>🏷️</span>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.8rem", color: "var(--text-primary)" }}>
                No Rental Prices Set
              </h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.35rem", maxWidth: "420px", margin: "0.35rem auto 1rem" }}>
                This equipment does not have active rental or lease rates configured yet. Add a rate tier to enable rental billing.
              </p>
              {selectedEquipmentId && (
                <Button size="sm" onClick={handleOpenAddModal}>
                  + Add First Rental Rate
                </Button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Price Type</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Rate Amount</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Currency</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Notes</th>
                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrices.map((p) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background-color var(--transition-fast)",
                      }}
                    >
                      <td style={{ padding: "0.85rem 0.5rem" }}>
                        <Badge
                          variant={
                            p.priceType === "LEASE_DAILY"
                              ? "info"
                              : p.priceType === "LEASE_MONTHLY"
                              ? "success"
                              : p.priceType === "LEASE_YEARLY"
                              ? "warning"
                              : "default"
                          }
                        >
                          {p.priceType ? p.priceType.replace("_", " ") : "STANDARD"}
                        </Badge>
                      </td>
                      <td style={{ padding: "0.85rem 0.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {formatIDR(Number(p.amount || 0))}
                      </td>
                      <td style={{ padding: "0.85rem 0.5rem", color: "var(--text-muted)" }}>
                        {p.currency || "IDR"}
                      </td>
                      <td style={{ padding: "0.85rem 0.5rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        {p.notes || "—"}
                      </td>
                      <td style={{ padding: "0.85rem 0.5rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEditModal(p)}>
                            ✏️ Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDeletePrice(p.id)}>
                            🗑️
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Add / Edit Rental Price Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            onClick={() => setIsModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
            }}
          />

          <Card
            style={{
              position: "relative",
              zIndex: 1001,
              width: "min(480px, 92vw)",
              padding: "1.75rem",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
              {editingPrice ? "Edit Rental Rate" : "Add Equipment Rental Rate"}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Target Asset: <strong>{selectedEquipment?.name}</strong>
            </p>

            <form onSubmit={handleSavePrice} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
                  Price / Lease Type
                </label>
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value as EquipmentPriceType)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                  }}
                >
                  <option value="LEASE_DAILY">LEASE_DAILY (Daily Rental Rate)</option>
                  <option value="LEASE_MONTHLY">LEASE_MONTHLY (Monthly Lease Rate)</option>
                  <option value="LEASE_YEARLY">LEASE_YEARLY (Annual Contract Rate)</option>
                  <option value="SALE">SALE (Direct Purchase Price)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
                  Rate Amount (IDR)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
                  Terms & Conditions / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Fuel excluded, operator provided upon request..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.75rem" }}>
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingPrice ? "Update Rate" : "Add Rate"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
