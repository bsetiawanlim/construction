"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, type SalesOrderRecord } from "@pz/shared";
import { posApi } from "@/lib/api";

interface PaymentEntry {
  method: string;
  amount: number;
  referenceNumber: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  order: SalesOrderRecord | null;
  payments: PaymentEntry[];
  changeAmount: number;
  onClose: () => void;
}

export function ReceiptModal({ isOpen, order, payments, changeAmount, onClose }: ReceiptModalProps) {
  const [emailInput, setEmailInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    const email = emailInput.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailStatus("sending");
    setEmailError(null);
    try {
      await posApi.sendReceipt({
        salesOrderId: order.id,
        channel: "EMAIL",
        destination: email,
        customerName: null,
      });
      setEmailStatus("sent");
    } catch (e: any) {
      setEmailStatus("error");
      setEmailError(e.message || "Failed to send email.");
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
        zIndex: 60,
        padding: "1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <Card glass style={{ padding: "1.75rem", backgroundColor: "#ffffff", color: "#111827" }}>
          {/* Receipt Header */}
          <div style={{ textAlign: "center", borderBottom: "1px dashed #d1d5db", paddingBottom: "1rem", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "0.05em" }}>CHRONO CAFE &amp; EATERY</h2>
            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Official Sales Receipt & Tax Invoice</p>
            <div style={{ marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{order.orderNumber}</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.2rem" }}>
              {new Date(order.orderDate || Date.now()).toLocaleString("id-ID")}
            </p>
          </div>

          {/* Customer, Facility & Table */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.35rem", color: "#4b5563" }}>
            <span>Customer:</span>
            <span style={{ fontWeight: 600 }}>{order.customerId ? `Customer #${order.customerId}` : "Walk-in Customer"}</span>
          </div>
          {(order.tableNumber || order.facility) && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.75rem", color: "#4b5563" }}>
              <span>{order.facility ? order.facility.facilityName : "Outlet"}</span>
              {order.tableNumber && (
                <span
                  style={{
                    fontWeight: 700,
                    color: order.tableNumber.toLowerCase() === "takeaway" ? "#d97706" : "#4f46e5",
                  }}
                >
                  {order.tableNumber.toLowerCase() === "takeaway" ? "🛍️ Takeaway" : `Table: ${order.tableNumber}`}
                </span>
              )}
            </div>
          )}

          {/* Item Lines */}
          <div style={{ borderBottom: "1px dashed #d1d5db", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
            {order.items?.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.productName}</div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    {item.quantity} x {formatIDR(item.unitPrice)}
                    {item.discountPercentage > 0 && ` (-${item.discountPercentage}%)`}
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{formatIDR(item.totalPrice)}</div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.85rem", borderBottom: "1px dashed #d1d5db", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#4b5563" }}>
              <span>Subtotal</span>
              <span>{formatIDR(order.subtotal)}</span>
            </div>

            {order.includeDiscount && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}>
                <span>Discount ({order.discountPercentage}%)</span>
                <span>-{formatIDR(order.discountAmount)}</span>
              </div>
            )}

            {order.includeTax && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#d97706" }}>
                <span>Tax ({order.taxPercentage}%)</span>
                <span>+{formatIDR(order.taxAmount)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", marginTop: "0.25rem" }}>
              <span>GRAND TOTAL</span>
              <span style={{ color: "#4f46e5" }}>{formatIDR(order.grandTotal)}</span>
            </div>
          </div>

          {/* Payments Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.8rem", color: "#4b5563", marginBottom: "1.25rem" }}>
            {payments.map((p, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Paid via {p.method} {p.referenceNumber && `(#${p.referenceNumber})`}</span>
                <span style={{ fontWeight: 600 }}>{formatIDR(p.amount)}</span>
              </div>
            ))}

            {changeAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#059669", marginTop: "0.25rem" }}>
                <span>Change Returned</span>
                <span>{formatIDR(changeAmount)}</span>
              </div>
            )}
          </div>

          {/* Digital Receipt via Email */}
          <div style={{ marginBottom: "1rem", padding: "0.85rem", borderRadius: "8px", backgroundColor: "#f5f3ff", border: "1px solid #ddd6fe" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              📧 Send Digital Receipt
            </p>
            {emailStatus === "sent" ? (
              <p style={{ margin: 0, fontSize: "0.83rem", color: "#059669", fontWeight: 600 }}>
                ✓ Receipt sent to {emailInput}
              </p>
            ) : (
              <>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="email"
                    placeholder="customer@email.com"
                    value={emailInput}
                    onChange={(e) => { setEmailInput(e.target.value); setEmailError(null); if (emailStatus === "error") setEmailStatus("idle"); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendEmail(); }}
                    style={{
                      flex: 1, padding: "0.45rem 0.65rem", borderRadius: "6px",
                      border: emailError ? "1px solid #ef4444" : "1px solid #c4b5fd",
                      fontSize: "0.82rem", outline: "none", backgroundColor: "#fff", color: "#111827",
                    }}
                    disabled={emailStatus === "sending"}
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={emailStatus === "sending"}
                    style={{
                      padding: "0.45rem 0.85rem", borderRadius: "6px", border: "none",
                      backgroundColor: "#4f46e5", color: "#fff", cursor: "pointer",
                      fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap",
                      opacity: emailStatus === "sending" ? 0.6 : 1,
                    }}
                  >
                    {emailStatus === "sending" ? "Sending…" : "Send →"}
                  </button>
                </div>
                {emailError && (
                  <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#ef4444" }}>{emailError}</p>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button
              id="print-receipt-btn"
              variant="secondary"
              onClick={handlePrint}
              style={{ flex: 1, backgroundColor: "#f3f4f6", color: "#111827", borderColor: "#d1d5db" }}
            >
              🖨️ Print
            </Button>
            <Button
              id="close-receipt-btn"
              variant="primary"
              onClick={onClose}
              style={{ flex: 1, backgroundColor: "#4f46e5" }}
            >
              Start New Sale →
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}