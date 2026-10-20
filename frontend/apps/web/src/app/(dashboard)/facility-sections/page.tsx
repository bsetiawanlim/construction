"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/authContext";
import { useDevice } from "@/lib/useDevice";
import { facilityApi, posApi, productApi } from "@/lib/api";
import { formatIDR, type FacilityRecord, type FacilitySectionRecord, type SalesOrderRecord, type ProductCategoryItem } from "@pz/shared";

// Standard station types for cafe & restaurant operations
export type StationType = "ALL" | "BAR" | "KITCHEN" | "STAGING" | string;

export interface StationTicketItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
  targetStation: "BAR" | "KITCHEN" | "STAGING" | "GENERAL";
  categoryName?: string;
}

export type TicketStatus = "QUEUED" | "PREPARING" | "READY" | "SERVED";

export interface TicketProgress {
  status: TicketStatus;
  startedAt?: number;
  readyAt?: number;
  completedAt?: number;
}

const BAR_KEYWORDS = [
  "coffee", "espresso", "latte", "cappuccino", "tea", "beverage", "drink",
  "cold brew", "matcha", "juice", "soda", "water", "brew", "affogato",
  "americano", "mocha", "macchiato", "kopi", "teh", "minuman", "syrup",
];

const KITCHEN_KEYWORDS = [
  "food", "kitchen", "pastry", "croissant", "cake", "toast", "sandwich",
  "bakery", "meal", "pasta", "rice", "noodle", "snack", "bread", "dessert",
  "cookie", "muffin", "salad", "burger", "makanan", "roti", "kue", "goreng",
];

function resolveTargetStation(
  productName: string,
  categoryName?: string,
  customRules?: Record<string, string>
): "BAR" | "KITCHEN" | "STAGING" | "GENERAL" {
  if (customRules) {
    if (categoryName && customRules[categoryName.toLowerCase()]) {
      return customRules[categoryName.toLowerCase()] as any;
    }
    if (customRules[productName.toLowerCase()]) {
      return customRules[productName.toLowerCase()] as any;
    }
  }

  const combined = `${categoryName || ""} ${productName}`.toLowerCase();
  for (const kw of BAR_KEYWORDS) {
    if (combined.includes(kw)) return "BAR";
  }
  for (const kw of KITCHEN_KEYWORDS) {
    if (combined.includes(kw)) return "KITCHEN";
  }
  return "KITCHEN";
}

export default function FacilitySectionsKDSPage() {
  const { user } = useAuth();
  const device = useDevice();
  const searchParams = useSearchParams();
  const router = useRouter();

  const facilityIdParam = searchParams.get("facilityId");
  const initialFacilityId = facilityIdParam ? Number(facilityIdParam) : null;

  // Facilities & Sections State
  const [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(initialFacilityId);
  const [facilitySections, setFacilitySections] = useState<FacilitySectionRecord[]>([]);
  const [categories, setCategories] = useState<ProductCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Station Filter
  const [activeStation, setActiveStation] = useState<StationType>("ALL");
  const [ticketFilterStatus, setTicketFilterStatus] = useState<"ACTIVE" | "READY" | "SERVED" | "ALL">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  // Orders State
  const [orders, setOrders] = useState<SalesOrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Per-Ticket Station Progress (stored in localStorage keyed by orderId + station)
  const [ticketProgressMap, setTicketProgressMap] = useState<Record<string, TicketProgress>>({});

  // Routing Rules Configuration Modal
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customRoutingRules, setCustomRoutingRules] = useState<Record<string, string>>({});

  // Printable Ticket Modal
  const [printingOrder, setPrintingOrder] = useState<SalesOrderRecord | null>(null);

  // Audio tone for incoming orders
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load facilities and initial category lists
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const [facRes, catRes] = await Promise.all([
          facilityApi.getFacilities({ limit: 100 }),
          productApi.getCategories(),
        ]);
        const facList = (facRes as any)?.data || (facRes as any)?.items || (Array.isArray(facRes) ? facRes : []);
        const catList = (catRes as any)?.data || (catRes as any)?.items || (Array.isArray(catRes) ? catRes : []);
        setFacilities(facList);
        setCategories(catList || []);

        if (!selectedFacilityId && facList.length > 0) {
          const storeFac = facList.find((f: any) => f.type === "STORE") || facList[0];
          setSelectedFacilityId(storeFac.id);
        }
      } catch (err: any) {
        console.error("Failed to load facilities for KDS", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [selectedFacilityId]);

  // Load sections for selected facility
  useEffect(() => {
    if (!selectedFacilityId) return;
    facilityApi
      .getSectionsByFacility(selectedFacilityId)
      .then((res: any) => {
        const secList = res?.data || res?.items || (Array.isArray(res) ? res : []);
        setFacilitySections(secList);
      })
      .catch((err: any) => console.error("Failed to load facility sections", err));
  }, [selectedFacilityId]);

  // Load saved ticket progress & custom routing rules from localStorage
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem("pz_kds_ticket_progress");
      if (savedProgress) setTicketProgressMap(JSON.parse(savedProgress));

      const savedRules = localStorage.getItem("pz_kds_routing_rules");
      if (savedRules) setCustomRoutingRules(JSON.parse(savedRules));
    } catch (e) {
      console.warn("Could not load KDS local storage", e);
    }
  }, []);

  // Save progress changes to localStorage
  const updateTicketProgress = useCallback((orderId: number, station: string, newStatus: TicketStatus) => {
    setTicketProgressMap((prev) => {
      const key = `${orderId}:${station}`;
      const existing = prev[key] || { status: "QUEUED" };
      const now = Date.now();
      const updated: TicketProgress = {
        ...existing,
        status: newStatus,
        startedAt: newStatus === "PREPARING" && !existing.startedAt ? now : existing.startedAt,
        readyAt: newStatus === "READY" ? now : existing.readyAt,
        completedAt: newStatus === "SERVED" ? now : existing.completedAt,
      };
      const nextMap = { ...prev, [key]: updated };
      try {
        localStorage.setItem("pz_kds_ticket_progress", JSON.stringify(nextMap));
      } catch (e) {
        console.warn("Storage error", e);
      }
      return nextMap;
    });
  }, []);

  // Save custom routing rule
  const handleSaveRule = (categoryName: string, station: string) => {
    setCustomRoutingRules((prev) => {
      const next = { ...prev, [categoryName.toLowerCase()]: station };
      try {
        localStorage.setItem("pz_kds_routing_rules", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Fetch sales orders for selected facility
  const loadOrders = useCallback(async () => {
    if (!selectedFacilityId) return;
    setOrdersLoading(true);
    try {
      const res = await posApi.listSalesOrders({
        facilityId: selectedFacilityId,
        limit: 100,
      });
      const orderList = Array.isArray(res?.items) ? res.items : Array.isArray((res as any)?.data) ? (res as any).data : [];
      setOrders(orderList);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error("Failed to load live orders for KDS", err);
    } finally {
      setOrdersLoading(false);
    }
  }, [selectedFacilityId]);

  // Initial & facility change load
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Auto-refresh interval (every 10 seconds)
  useEffect(() => {
    if (!autoRefreshEnabled || !selectedFacilityId) return;
    const timer = setInterval(() => {
      loadOrders();
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, selectedFacilityId, loadOrders]);

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  // Group items by station for each order
  const processedOrders = useMemo(() => {
    return orders.map((order) => {
      const rawItems = order.items || [];
      const stationItems: StationTicketItem[] = rawItems.map((item) => {
        const catName = (item as any).product?.category?.categoryName;
        const targetStation = resolveTargetStation(item.productName, catName, customRoutingRules);
        return {
          id: item.id,
          productName: item.productName,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          notes: item.notes,
          targetStation,
          categoryName: catName,
        };
      });

      // Filter items according to activeStation
      const filteredItems =
        activeStation === "ALL"
          ? stationItems
          : stationItems.filter((i) => i.targetStation === activeStation);

      const ticketKey = `${order.id}:${activeStation}`;
      const progress = ticketProgressMap[ticketKey] || { status: order.status === "COMPLETED" ? "QUEUED" : "QUEUED" };

      const barItemCount = stationItems.filter((i) => i.targetStation === "BAR").reduce((sum, i) => sum + i.quantity, 0);
      const kitchenItemCount = stationItems.filter((i) => i.targetStation === "KITCHEN").reduce((sum, i) => sum + i.quantity, 0);

      return {
        ...order,
        stationItems,
        filteredItems,
        barItemCount,
        kitchenItemCount,
        progress,
      };
    });
  }, [orders, activeStation, customRoutingRules, ticketProgressMap]);

  // Filter orders by active ticket status & search query
  const visibleOrders = useMemo(() => {
    return processedOrders.filter((order) => {
      // Must have at least 1 item destined for the active station
      if (order.filteredItems.length === 0) return false;

      // Filter by progress status
      if (ticketFilterStatus === "ACTIVE") {
        if (order.progress.status === "SERVED") return false;
      } else if (ticketFilterStatus === "READY") {
        if (order.progress.status !== "READY") return false;
      } else if (ticketFilterStatus === "SERVED") {
        if (order.progress.status !== "SERVED") return false;
      }

      // Search query filter (Order number, Table number, customer name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (order.orderNumber || "").toLowerCase();
        const tab = (order.tableNumber || "").toLowerCase();
        const cust = ((order as any).customer?.profile?.firstName || "").toLowerCase();
        return num.includes(q) || tab.includes(q) || cust.includes(q);
      }

      return true;
    });
  }, [processedOrders, ticketFilterStatus, searchQuery]);

  // Overall statistics for current facility
  const stationMetrics = useMemo(() => {
    let totalBarItems = 0;
    let totalKitchenItems = 0;
    let activeTicketsCount = 0;
    let readyTicketsCount = 0;

    processedOrders.forEach((o) => {
      totalBarItems += o.barItemCount;
      totalKitchenItems += o.kitchenItemCount;
      if (o.progress.status === "QUEUED" || o.progress.status === "PREPARING") activeTicketsCount++;
      if (o.progress.status === "READY") readyTicketsCount++;
    });

    return { totalBarItems, totalKitchenItems, activeTicketsCount, readyTicketsCount };
  }, [processedOrders]);

  // Calculate elapsed time formatted string
  const getElapsedBadge = (createdAtStr?: string | Date) => {
    if (!createdAtStr) return { text: "Just now", color: "var(--accent-emerald)" };
    const orderTime = new Date(createdAtStr).getTime();
    const diffMins = Math.floor((Date.now() - orderTime) / 60000);

    if (diffMins < 1) return { text: "Just now", color: "var(--accent-emerald)" };
    if (diffMins < 5) return { text: `${diffMins}m ago`, color: "var(--accent-emerald)" };
    if (diffMins < 10) return { text: `${diffMins}m ago`, color: "var(--accent-amber)" };
    return { text: `🔥 ${diffMins}m ago (Rush)`, color: "var(--accent-rose)" };
  };

  // Print thermal slip for specific order
  const handlePrintSlip = (order: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Kitchen Slip #${order.orderNumber}</title>
          <style>
            body { font-family: monospace; padding: 1.5rem; max-width: 300px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 0.5rem; margin-bottom: 0.75rem; }
            .station { font-size: 1.2rem; font-weight: bold; margin: 0.35rem 0; }
            .table { font-size: 1.4rem; font-weight: bold; }
            .item-row { display: flex; justify-content: space-between; margin: 0.4rem 0; font-size: 1.05rem; }
            .notes { font-size: 0.85rem; font-style: italic; margin-left: 1rem; color: #333; }
            .footer { border-top: 1px dashed #000; margin-top: 1rem; padding-top: 0.5rem; text-align: center; font-size: 0.8rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>${selectedFacility?.facilityName || "Chrono"}</div>
            <div class="station">STATION: ${activeStation === "ALL" ? "ALL STATIONS" : activeStation}</div>
            <div class="table">${order.tableNumber ? `TABLE ${order.tableNumber}` : "WALK-IN / TAKEAWAY"}</div>
            <div>Order: #${order.orderNumber}</div>
            <div>Time: ${new Date(order.orderDate || Date.now()).toLocaleTimeString()}</div>
          </div>
          <div class="items">
            ${order.filteredItems
              .map(
                (it: any) => `
              <div class="item-row">
                <span><strong>${it.quantity}x</strong> ${it.productName}</span>
                <span>[${it.targetStation}]</span>
              </div>
              ${it.notes ? `<div class="notes">>> Note: ${it.notes}</div>` : ""}
            `
              )
              .join("")}
          </div>
          <div class="footer">
            <div>Printed via Section KDS</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", minHeight: "calc(100vh - 120px)" }}>
      {/* ── Top Header Toolbar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🍳</span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Facility Section Orders & KDS
            </h2>
            <Badge variant="success" style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>
              LIVE TICKETS
            </Badge>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.15rem" }}>
            Automatic order dispatch to stations: coffee items route to the <strong>Bar</strong>, food items route to the <strong>Kitchen</strong>.
          </p>
        </div>

        {/* Facility Selector & Live Refresh Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <select
            id="kds-facility-select"
            value={selectedFacilityId ?? ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedFacilityId(val);
              router.push(`/facility-sections?facilityId=${val}`);
            }}
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-glow)",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                🏪 {f.facilityName} ({f.facilityCode})
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsConfigOpen(true)}
            title="Configure category to section routing rules"
          >
            ⚙️ Routing Rules
          </Button>

          <Button
            size="sm"
            variant={autoRefreshEnabled ? "primary" : "secondary"}
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            title="Auto-refresh tickets every 10 seconds"
          >
            {autoRefreshEnabled ? "🟢 Auto 10s" : "⚪ Paused"}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={loadOrders}
            isLoading={ordersLoading}
            title="Manually refresh orders now"
          >
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* ── Operational Metric Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
        <Card style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #6366f1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              ☕ Bar Drinks in Queue
            </span>
            <span style={{ fontSize: "1.2rem" }}>🍹</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#818cf8", marginTop: "0.25rem" }}>
            {stationMetrics.totalBarItems} <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)" }}>beverages</span>
          </div>
        </Card>

        <Card style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              🍳 Kitchen Orders in Queue
            </span>
            <span style={{ fontSize: "1.2rem" }}>🥐</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fbbf24", marginTop: "0.25rem" }}>
            {stationMetrics.totalKitchenItems} <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)" }}>dishes</span>
          </div>
        </Card>

        <Card style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              🔔 Ready to Serve
            </span>
            <span style={{ fontSize: "1.2rem" }}>🛎️</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#34d399", marginTop: "0.25rem" }}>
            {stationMetrics.readyTicketsCount} <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)" }}>tickets</span>
          </div>
        </Card>

        <Card style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #38bdf8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              📋 Active Order Tickets
            </span>
            <span style={{ fontSize: "1.2rem" }}>🧾</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#38bdf8", marginTop: "0.25rem" }}>
            {stationMetrics.activeTicketsCount} <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)" }}>total</span>
          </div>
        </Card>
      </div>

      {/* ── Station Tabs & Status Filter Toolbar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          backgroundColor: "var(--bg-surface)",
          padding: "0.6rem 0.85rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Station Navigation Tabs */}
        <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto" }}>
          <button
            onClick={() => setActiveStation("ALL")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              backgroundColor: activeStation === "ALL" ? "var(--primary)" : "transparent",
              color: activeStation === "ALL" ? "#ffffff" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              whiteSpace: "nowrap",
            }}
          >
            🏢 All Stations ({orders.length})
          </button>

          <button
            onClick={() => setActiveStation("BAR")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              backgroundColor: activeStation === "BAR" ? "#6366f1" : "transparent",
              color: activeStation === "BAR" ? "#ffffff" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              whiteSpace: "nowrap",
            }}
          >
            ☕ Bar & Beverages ({processedOrders.filter((o) => o.barItemCount > 0).length})
          </button>

          <button
            onClick={() => setActiveStation("KITCHEN")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              backgroundColor: activeStation === "KITCHEN" ? "#f59e0b" : "transparent",
              color: activeStation === "KITCHEN" ? "#ffffff" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              whiteSpace: "nowrap",
            }}
          >
            🍳 Kitchen & Bakery ({processedOrders.filter((o) => o.kitchenItemCount > 0).length})
          </button>

          {/* Additional Dynamic Facility Sections */}
          {facilitySections
            .filter((s) => s.type === "COUNTER" || s.type === "DISPLAY" || s.type === "STAGING")
            .map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveStation(sec.sectionCode)}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  backgroundColor: activeStation === sec.sectionCode ? "var(--accent-cyan)" : "transparent",
                  color: activeStation === sec.sectionCode ? "#ffffff" : "var(--text-secondary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                📍 {sec.sectionName}
              </button>
            ))}
        </div>

        {/* Ticket Lifecycle Filter & Search */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", backgroundColor: "var(--bg-surface-elevated)", borderRadius: "var(--radius-md)", padding: "0.2rem", border: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setTicketFilterStatus("ACTIVE")}
              style={{
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 600,
                backgroundColor: ticketFilterStatus === "ACTIVE" ? "var(--primary)" : "transparent",
                color: ticketFilterStatus === "ACTIVE" ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              🔥 Active ({processedOrders.filter((o) => o.progress.status !== "SERVED" && o.filteredItems.length > 0).length})
            </button>
            <button
              onClick={() => setTicketFilterStatus("READY")}
              style={{
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 600,
                backgroundColor: ticketFilterStatus === "READY" ? "var(--accent-emerald)" : "transparent",
                color: ticketFilterStatus === "READY" ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              🔔 Ready ({processedOrders.filter((o) => o.progress.status === "READY" && o.filteredItems.length > 0).length})
            </button>
            <button
              onClick={() => setTicketFilterStatus("SERVED")}
              style={{
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 600,
                backgroundColor: ticketFilterStatus === "SERVED" ? "var(--text-muted)" : "transparent",
                color: ticketFilterStatus === "SERVED" ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              ✅ Served
            </button>
            <button
              onClick={() => setTicketFilterStatus("ALL")}
              style={{
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 600,
                backgroundColor: ticketFilterStatus === "ALL" ? "var(--bg-surface)" : "transparent",
                color: ticketFilterStatus === "ALL" ? "var(--text-primary)" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              All
            </button>
          </div>

          <Input
            placeholder="Search ticket / table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "170px", padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
          />
        </div>
      </div>

      {/* ── KDS Tickets Grid ── */}
      {ordersLoading && orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</p>
          <p>Loading live section order tickets...</p>
        </div>
      ) : visibleOrders.length === 0 ? (
        <Card style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🍽️</p>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
            No Orders In This Station Queue
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
            {activeStation === "BAR"
              ? "All coffee and beverage orders have been prepared or none currently waiting."
              : activeStation === "KITCHEN"
              ? "Kitchen orders are all clear! New food tickets will appear automatically."
              : "No incoming tickets match your active filter criteria."}
          </p>
          <Button size="sm" variant="secondary" onClick={loadOrders} style={{ marginTop: "1rem" }}>
            🔄 Refresh Ticket Board
          </Button>
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
            gap: "1rem",
            alignItems: "start",
          }}
        >
          {visibleOrders.map((order) => {
            const elapsed = getElapsedBadge(order.orderDate || order.createdAt);
            const statusVariant =
              order.progress.status === "READY"
                ? "success"
                : order.progress.status === "PREPARING"
                ? "warning"
                : order.progress.status === "SERVED"
                ? "default"
                : "default";

            return (
              <Card
                key={order.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "1rem",
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "var(--radius-lg)",
                  border:
                    order.progress.status === "READY"
                      ? "1px solid rgba(16, 185, 129, 0.5)"
                      : order.progress.status === "PREPARING"
                      ? "1px solid rgba(245, 158, 11, 0.5)"
                      : "1px solid var(--border-subtle)",
                  boxShadow:
                    order.progress.status === "READY"
                      ? "0 4px 20px -4px rgba(16, 185, 129, 0.25)"
                      : order.progress.status === "PREPARING"
                      ? "0 4px 20px -4px rgba(245, 158, 11, 0.2)"
                      : "none",
                  transition: "all var(--transition-fast)",
                }}
              >
                {/* ── Ticket Header ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--primary)" }}>
                        #{order.orderNumber}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.1rem 0.4rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: elapsed.color,
                          color: "#ffffff",
                        }}
                      >
                        ⏱️ {elapsed.text}
                      </span>
                    </div>

                    <div style={{ marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      {order.tableNumber ? (
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            color: "var(--accent-amber)",
                            backgroundColor: "rgba(245, 158, 11, 0.12)",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          🪑 Table {order.tableNumber}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                          🚶 Walk-in / Takeaway
                        </span>
                      )}
                      {(order as any).customer?.profile?.firstName && (
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          • {(order as any).customer.profile.firstName}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge variant={statusVariant} style={{ fontSize: "0.72rem", textTransform: "uppercase" }}>
                    {order.progress.status}
                  </Badge>
                </div>

                {/* ── Order Level Notes if present ── */}
                {order.notes && (
                  <div
                    style={{
                      padding: "0.35rem 0.55rem",
                      backgroundColor: "rgba(99, 102, 241, 0.08)",
                      border: "1px dashed var(--border-glow)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.6rem",
                    }}
                  >
                    📝 Order Note: <strong>{order.notes}</strong>
                  </div>
                )}

                {/* ── Section Specific Line Items ── */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.45rem",
                    borderTop: "1px solid var(--border-subtle)",
                    borderBottom: "1px solid var(--border-subtle)",
                    padding: "0.6rem 0",
                    margin: "0.4rem 0",
                  }}
                >
                  {order.filteredItems.map((item) => {
                    const isBar = item.targetStation === "BAR";
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "0.5rem",
                          padding: "0.3rem 0.4rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-surface-elevated)",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span
                              style={{
                                width: "22px",
                                height: "22px",
                                borderRadius: "4px",
                                backgroundColor: isBar ? "#6366f1" : "#f59e0b",
                                color: "#ffffff",
                                fontWeight: 800,
                                fontSize: "0.82rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {item.quantity}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                              {item.productName}
                            </span>
                          </div>

                          {item.notes && (
                            <div style={{ fontSize: "0.74rem", color: "var(--accent-amber)", marginTop: "0.15rem", paddingLeft: "1.7rem" }}>
                              ↳ <em>"{item.notes}"</em>
                            </div>
                          )}
                        </div>

                        {/* Station Tag if in ALL view */}
                        {activeStation === "ALL" && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "0.1rem 0.35rem",
                              borderRadius: "var(--radius-sm)",
                              backgroundColor: isBar ? "rgba(99, 102, 241, 0.15)" : "rgba(245, 158, 11, 0.15)",
                              color: isBar ? "#818cf8" : "#fbbf24",
                            }}
                          >
                            {isBar ? "☕ BAR" : "🍳 KITCHEN"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Footer Station Actions ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem", gap: "0.5rem" }}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePrintSlip(order)}
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                    title="Print kitchen/bar ticket slip"
                  >
                    🖨️ Print Slip
                  </Button>

                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    {order.progress.status === "QUEUED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateTicketProgress(order.id, activeStation, "PREPARING")}
                        style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
                      >
                        ⏱️ Start Prep
                      </Button>
                    )}

                    {order.progress.status === "PREPARING" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateTicketProgress(order.id, activeStation, "READY")}
                        style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem", backgroundColor: "var(--accent-emerald)" }}
                      >
                        🔔 Mark Ready
                      </Button>
                    )}

                    {order.progress.status === "READY" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateTicketProgress(order.id, activeStation, "SERVED")}
                        style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
                      >
                        ✅ Served
                      </Button>
                    )}

                    {order.progress.status === "SERVED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateTicketProgress(order.id, activeStation, "QUEUED")}
                        style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
                      >
                        ↺ Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Station Routing Rules Configuration Modal ── */}
      {isConfigOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <Card style={{ width: "100%", maxWidth: "560px", padding: "1.75rem", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  ⚙️ Station Order Routing Rules
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  Configure which categories route to the Bar or Kitchen for {selectedFacility?.facilityName}.
                </p>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
                Default Keyword Matching:
              </span>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem", lineHeight: 1.4 }}>
                • <strong>Bar & Drinks (☕)</strong>: Coffee, Espresso, Latte, Cappuccino, Tea, Beverage, Cold Brew, Matcha, Juices.<br />
                • <strong>Kitchen & Bakery (🍳)</strong>: Food, Pastry, Croissant, Cake, Toast, Sandwich, Meals, Pasta, Rice dishes.
              </p>
            </div>

            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Category Overrides
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "280px", overflowY: "auto" }}>
              {categories.map((cat) => {
                const currentStation = resolveTargetStation("", cat.categoryName, customRoutingRules);
                return (
                  <div
                    key={cat.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                        {cat.categoryName}
                      </span>
                      {cat.description && (
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{cat.description}</p>
                      )}
                    </div>

                    <select
                      value={currentStation}
                      onChange={(e) => handleSaveRule(cat.categoryName, e.target.value)}
                      style={{
                        padding: "0.25rem 0.55rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-glow)",
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-primary)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <option value="BAR">☕ Bar / Drinks</option>
                      <option value="KITCHEN">🍳 Kitchen / Food</option>
                      <option value="STAGING">📦 Staging / Packaging</option>
                    </select>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.25rem" }}>
              <Button size="sm" onClick={() => setIsConfigOpen(false)}>
                Done & Save Rules
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
