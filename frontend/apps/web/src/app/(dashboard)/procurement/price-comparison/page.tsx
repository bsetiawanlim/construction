"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { vendorApi } from "@/lib/api";
import { formatIDR } from "@pz/shared";
import type { VendorProductRecord } from "@pz/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VendorMeta {
  id: number;
  name: string;
}

interface ProductRow {
  productId: number;
  productName: string;
  sku: string | null;
  unitLabel: string | null;
  currentStock: number;
  categoryName: string | null;
  offers: Record<number, VendorProductRecord>; // keyed by vendorId
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getVendorName(vp: VendorProductRecord): string {
  const p = vp.vendor?.profile;
  if (!p) return `Vendor #${vp.vendorId}`;
  return p.isCompany
    ? p.firstName
    : [p.firstName, p.lastName].filter(Boolean).join(" ");
}

function parsePrice(raw?: number | string | null): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "string" ? parseFloat(raw) : raw;
  return isNaN(n) ? null : n;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PriceComparisonPage() {
  const [records, setRecords] = useState<VendorProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await vendorApi.listVendorProducts({ limit: 500, page: 1 });
      setRecords(res.items ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load vendor products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build the comparison matrix
  const { vendorList, productRows } = useMemo(() => {
    const vendorMap = new Map<number, VendorMeta>();
    const productMap = new Map<number, ProductRow>();

    for (const vp of records) {
      if (!vp.product || !vp.vendor) continue;

      // Collect vendor
      if (!vendorMap.has(vp.vendorId)) {
        vendorMap.set(vp.vendorId, { id: vp.vendorId, name: getVendorName(vp) });
      }

      // Collect product row
      if (!productMap.has(vp.productId)) {
        productMap.set(vp.productId, {
          productId: vp.productId,
          productName: vp.product.productName,
          sku: vp.product.sku ?? null,
          unitLabel: vp.product.unitLabel ?? null,
          currentStock: vp.product.currentStock ?? 0,
          categoryName: vp.product.category?.categoryName ?? null,
          offers: {},
        });
      }
      productMap.get(vp.productId)!.offers[vp.vendorId] = vp;
    }

    // Only include products that have at least 2 vendor offers (comparison makes sense)
    const rows = Array.from(productMap.values())
      .filter(r => Object.keys(r.offers).length >= 1)
      .sort((a, b) => a.productName.localeCompare(b.productName));

    return {
      vendorList: Array.from(vendorMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      productRows: rows,
    };
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return productRows;
    return productRows.filter(r =>
      r.productName.toLowerCase().includes(q) ||
      (r.sku || "").toLowerCase().includes(q) ||
      (r.categoryName || "").toLowerCase().includes(q)
    );
  }, [productRows, search]);

  // Stats
  const multiVendorCount = productRows.filter(r => Object.keys(r.offers).length > 1).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

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
            <Badge variant="info">🔍 Procurement</Badge>
            <Badge variant="default">Price Intelligence</Badge>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Supplier Price Comparison
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.35rem", lineHeight: 1.5, maxWidth: "640px" }}>
            Compare vendor prices side-by-side for every product. Spot the best deal, identify preferred suppliers, and track lead times at a glance.
          </p>
          {!loading && !error && (
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              <StatChip label="Products" value={productRows.length} color="var(--accent-blue)" />
              <StatChip label="Vendors" value={vendorList.length} color="var(--accent-emerald)" />
              <StatChip label="Multi-Vendor Products" value={multiVendorCount} color="var(--accent-amber)" />
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <span style={{
            position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", fontSize: "0.9rem", pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or category..."
            style={{
              width: "100%", padding: "0.6rem 0.85rem 0.6rem 2.25rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)", fontSize: "0.875rem",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              padding: "0.6rem 1rem", borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)", background: "var(--bg-surface)",
              color: "var(--text-secondary)", fontSize: "0.8rem", cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", flexShrink: 0 }}>
          {loading ? "Loading..." : `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <Card style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Loading vendor price data...
        </Card>
      ) : error ? (
        <Card style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "1.5rem" }}>⚠️</p>
          <p style={{ color: "var(--accent-rose)", marginTop: "0.5rem" }}>{error}</p>
          <button onClick={fetchAll} style={{
            marginTop: "1rem", padding: "0.5rem 1.25rem",
            borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)", color: "var(--text-primary)", cursor: "pointer", fontSize: "0.85rem",
          }}>Retry</button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ fontSize: "2.5rem" }}>📭</p>
          <p style={{ color: "var(--text-muted)", marginTop: "0.75rem", fontSize: "0.9rem" }}>
            {search ? "No products match your search." : "No vendor product links found. Link products to vendors first."}
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map(row => (
            <ProductComparisonCard key={row.productId} row={row} vendorList={vendorList} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
      <span style={{ fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function ProductComparisonCard({ row, vendorList }: { row: ProductRow; vendorList: VendorMeta[] }) {
  const vendorIds = Object.keys(row.offers).map(Number);
  const activeVendors = vendorList.filter(v => vendorIds.includes(v.id));

  // Find cheapest price
  const prices = vendorIds
    .map(vid => parsePrice(row.offers[vid]?.vendorPrice))
    .filter((p): p is number => p !== null);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const savings = minPrice !== null && maxPrice !== null && maxPrice !== minPrice
    ? maxPrice - minPrice
    : null;

  const hasMultiple = activeVendors.length > 1;

  return (
    <Card style={{ padding: "0", overflow: "hidden" }}>
      {/* Product Header */}
      <div style={{
        padding: "1rem 1.5rem",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem",
        backgroundColor: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {row.productName}
              </span>
              {row.sku && (
                <span style={{
                  fontSize: "0.72rem", fontFamily: "monospace", color: "var(--text-muted)",
                  backgroundColor: "var(--bg-surface)", padding: "0.15rem 0.4rem",
                  borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)",
                }}>
                  {row.sku}
                </span>
              )}
              {row.categoryName && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {row.categoryName}
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
              Stock: <strong style={{ color: row.currentStock <= 0 ? "var(--accent-rose)" : "var(--text-secondary)" }}>
                {row.currentStock} {row.unitLabel || "units"}
              </strong>
              {" · "}{activeVendors.length} vendor{activeVendors.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {minPrice !== null && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Best Price</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-emerald)" }}>
                {formatIDR(minPrice)}
              </div>
            </div>
          )}
          {savings !== null && savings > 0 && (
            <Badge variant="warning">
              Save {formatIDR(savings)}
            </Badge>
          )}
        </div>
      </div>

      {/* Vendor Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(activeVendors.length, 4)}, 1fr)`,
        gap: "0",
      }}>
        {activeVendors.map((vendor, idx) => {
          const offer = row.offers[vendor.id];
          const price = parsePrice(offer?.vendorPrice);
          const isBest = price !== null && minPrice !== null && price === minPrice && hasMultiple;
          const isPreferred = offer?.isPreferred === true;

          return (
            <div key={vendor.id} style={{
              padding: "1rem 1.25rem",
              borderLeft: idx > 0 ? "1px solid var(--border-subtle)" : "none",
              borderTop: "none",
              backgroundColor: isBest ? "rgba(16,185,129,0.04)" : "transparent",
              position: "relative",
            }}>
              {/* Vendor name + badges */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
                <span style={{
                  fontSize: "0.82rem", fontWeight: 600,
                  color: isBest ? "var(--accent-emerald)" : "var(--text-primary)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px",
                }}>
                  {vendor.name}
                </span>
                {isBest && <span style={{ fontSize: "0.65rem", color: "var(--accent-emerald)", fontWeight: 700 }}>✓ BEST</span>}
                {isPreferred && <span style={{ fontSize: "0.65rem", color: "var(--accent-blue)", fontWeight: 700 }}>★ PREFERRED</span>}
              </div>

              {/* Price */}
              <div style={{ marginBottom: "0.5rem" }}>
                {price !== null ? (
                  <span style={{
                    fontSize: "1.1rem", fontWeight: 800,
                    color: isBest ? "var(--accent-emerald)" : "var(--text-primary)",
                  }}>
                    {formatIDR(price)}
                  </span>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    No price set
                  </span>
                )}
                {offer?.currency && offer.currency !== "IDR" && (
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "0.3rem" }}>
                    ({offer.currency})
                  </span>
                )}
              </div>

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                {offer?.vendorSku && (
                  <Detail label="Vendor SKU" value={offer.vendorSku} />
                )}
                {offer?.leadTimeDays != null && (
                  <Detail label="Lead Time" value={`${offer.leadTimeDays}d`} />
                )}
                {offer?.minOrderQuantity != null && (
                  <Detail label="Min. Qty" value={String(offer.minOrderQuantity)} />
                )}
              </div>

              {/* Price difference badge */}
              {hasMultiple && price !== null && minPrice !== null && price > minPrice && (
                <div style={{
                  marginTop: "0.6rem", fontSize: "0.72rem", fontWeight: 600,
                  color: "var(--accent-rose)", backgroundColor: "rgba(239,68,68,0.08)",
                  borderRadius: "var(--radius-sm)", padding: "0.2rem 0.5rem", display: "inline-block",
                }}>
                  +{formatIDR(price - minPrice)} vs best
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", minWidth: "60px" }}>{label}</span>
      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
