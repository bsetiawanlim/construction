"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { facilityApi, type FacilityRecord } from "@/lib/api";
import { encodeTableToken } from "@pz/shared";

interface TableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFacilityId?: number | null;
  defaultTableInput?: string;
}

interface TableCardData {
  tableNumber: string;
  url: string;
  qrDataUrl: string;
}

export function TableQrModal({
  isOpen,
  onClose,
  defaultFacilityId,
  defaultTableInput,
}: TableQrModalProps) {
  const [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(
    defaultFacilityId ?? null
  );
  const [tableInput, setTableInput] = useState<string>(
    defaultTableInput ?? "T-01, T-02, T-03, T-04, T-05"
  );
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [cards, setCards] = useState<TableCardData[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (defaultFacilityId) setSelectedFacilityId(defaultFacilityId);
    if (defaultTableInput) setTableInput(defaultTableInput);
  }, [defaultFacilityId, defaultTableInput, isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
    facilityApi
      .getFacilities({ limit: 50 })
      .then((res: any) => {
        const facs = res?.data || res?.items || (Array.isArray(res) ? res : []);
        setFacilities(facs);
        if (facs.length > 0 && !selectedFacilityId && !defaultFacilityId) {
          const store = facs.find((f: any) => f.type === "STORE") || facs[0];
          setSelectedFacilityId(store.id);
        }
      })
      .catch((err) => console.error("Failed to load facilities for QR", err));
  }, [selectedFacilityId, defaultFacilityId]);

  // If a facility is selected and no custom table input was passed, try loading its existing tables
  useEffect(() => {
    if (!isOpen || !selectedFacilityId || defaultTableInput) return;
    facilityApi
      .getTablesByFacility(selectedFacilityId)
      .then((res: any) => {
        const items = res?.data || (Array.isArray(res) ? res : []);
        if (items.length > 0) {
          const tableNumbers = items.map((t: any) => t.tableNumber).join(", ");
          setTableInput(tableNumbers);
        }
      })
      .catch((err) => console.warn("Could not prefetch tables for facility QR", err));
  }, [isOpen, selectedFacilityId, defaultTableInput]);

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  useEffect(() => {
    if (!isOpen || !selectedFacilityId || !baseUrl) return;

    let isMounted = true;
    setGenerating(true);

    const parseTables = () => {
      return tableInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    };

    const tables = parseTables();
    if (tables.length === 0) {
      setCards([]);
      setGenerating(false);
      return;
    }

    Promise.all(
      tables.map(async (tableNumber) => {
        // Encode facility ID and table number into URL-safe token
        const encoded = encodeTableToken(selectedFacilityId, tableNumber);
        const url = `${baseUrl}/order/table?code=${encoded}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 1,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
        return { tableNumber, url, qrDataUrl };
      })
    )
      .then((generatedCards) => {
        if (isMounted) {
          setCards(generatedCards);
          setGenerating(false);
        }
      })
      .catch((err) => {
        console.error("Failed to generate QR codes", err);
        if (isMounted) setGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedFacilityId, tableInput, baseUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = (url: string, index: number) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 110,
        padding: "1.5rem",
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-facility-qr-placards,
          #printable-facility-qr-placards * {
            visibility: visible;
          }
          #printable-facility-qr-placards {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem !important;
            padding: 1rem !important;
          }
          .qr-table-placard {
            border: 2px solid #000000 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
              🪑 Facility Table QR Placard Generator
            </h3>
            <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Generate, preview, and batch-print table tent placards with encoded self-service order URLs.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Configuration Controls */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr auto",
            gap: "1rem",
            alignItems: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Facility Picker */}
          <div>
            <label
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "0.3rem",
              }}
            >
              Facility Location:
            </label>
            <select
              value={selectedFacilityId ?? ""}
              onChange={(e) => setSelectedFacilityId(Number(e.target.value) || null)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.facilityName} ({fac.facilityCode})
                </option>
              ))}
            </select>
          </div>

          {/* Tables Input */}
          <div>
            <label
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: "0.3rem",
              }}
            >
              Table Numbers (comma separated):
            </label>
            <Input
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              placeholder="e.g. T-01, T-02, T-03, VIP-01"
              style={{ width: "100%" }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={cards.length === 0 || generating}
            >
              🖨️ Print Placards
            </Button>
          </div>
        </div>

        {/* QR Code Cards Preview Grid (Printable Area) */}
        <div
          id="printable-facility-qr-placards"
          style={{
            padding: "1.5rem",
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: "1.25rem",
            flex: 1,
            backgroundColor: "var(--bg-primary)",
          }}
        >
          {generating ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
                color: "var(--text-muted)",
              }}
            >
              Generating encoded QR barcodes...
            </div>
          ) : cards.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
                color: "var(--text-muted)",
              }}
            >
              Please enter at least one table number above.
            </div>
          ) : (
            cards.map((card, index) => (
              <div
                key={card.tableNumber}
                className="qr-table-placard"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  borderRadius: "12px",
                  padding: "1.25rem 1rem",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  border: "2px solid #e2e8f0",
                  position: "relative",
                  pageBreakInside: "avoid",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: "#6366f1",
                    textTransform: "uppercase",
                  }}
                >
                  {selectedFacility?.facilityName || "CHRONO"}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#1e293b",
                    marginTop: "0.15rem",
                  }}
                >
                  Scan to Order
                </div>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    padding: "0.5rem",
                    borderRadius: "8px",
                    margin: "0.75rem 0",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <img
                    src={card.qrDataUrl}
                    alt={`Table ${card.tableNumber} QR`}
                    style={{ width: "160px", height: "160px", display: "block" }}
                  />
                </div>

                <div
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 900,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                  }}
                >
                  TABLE {card.tableNumber}
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#64748b",
                    marginTop: "0.2rem",
                    maxWidth: "180px",
                    lineHeight: 1.25,
                  }}
                >
                  Point camera to open digital menu & order
                </div>

                <button
                  onClick={() => handleCopyLink(card.url, index)}
                  style={{
                    marginTop: "0.6rem",
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.68rem",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: copiedIndex === index ? "#10b981" : "#f1f5f9",
                    color: copiedIndex === index ? "#ffffff" : "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  {copiedIndex === index ? "✓ Copied!" : "📋 Copy Encoded Link"}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--bg-surface-elevated)",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Tip: Placards embed encoded tokens into the URL so IDs are hidden from customers.
          </span>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
