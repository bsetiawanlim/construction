import nodemailer from "nodemailer";

export interface ReceiptEmailData {
  to: string;
  customerName: string;
  orderNumber: string;
  orderDate: Date;
  facilityName: string;
  facilityAddress?: string | null;
  items: { productName: string; quantity: number; unitPrice: number; totalPrice: number; notes?: string | null }[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  includeDiscount: boolean;
  taxAmount: number;
  taxPercentage: number;
  includeTax: boolean;
  grandTotal: number;
  payments: { method: string; amount: number; changeAmount?: number }[];
  tableNumber?: string | null;
  promoCode?: string | null;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !user || !pass) {
    throw new Error("Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function buildReceiptHtml(d: ReceiptEmailData): string {
  const dateStr = d.orderDate.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

  const itemRows = d.items
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;">
          <div style="font-weight:600;color:#1f2937;">${item.productName}</div>
          ${item.notes ? `<div style="font-size:11px;color:#6b7280;margin-top:2px;">Note: ${item.notes}</div>` : ""}
        </td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#4b5563;">${item.quantity}×</td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;text-align:right;color:#4b5563;">${formatIDR(item.unitPrice)}</td>
        <td style="padding:6px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#1f2937;">${formatIDR(item.totalPrice)}</td>
      </tr>`
    )
    .join("");

  const paymentRows = d.payments
    .map(
      (p) => `
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#4b5563;margin-bottom:4px;">
        <span>Paid via ${p.method}</span>
        <span>${formatIDR(p.amount)}</span>
      </div>
      ${
        (p.changeAmount ?? 0) > 0
          ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#059669;margin-bottom:4px;">
               <span>Change Returned</span><span>${formatIDR(p.changeAmount!)}</span>
             </div>`
          : ""
      }`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Receipt – ${d.orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.04em;">${d.facilityName.toUpperCase()}</h1>
      ${d.facilityAddress ? `<p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">${d.facilityAddress}</p>` : ""}
      <div style="margin-top:12px;display:inline-block;background:rgba(255,255,255,0.15);border-radius:6px;padding:4px 14px;">
        <span style="color:#e0e7ff;font-size:13px;font-weight:600;">OFFICIAL RECEIPT</span>
      </div>
    </div>

    <!-- Order Meta -->
    <div style="padding:20px 32px;background:#f8f7ff;border-bottom:1px solid #ede9fe;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:12px;color:#6b7280;font-weight:500;">ORDER NUMBER</span>
        <span style="font-size:13px;font-weight:700;color:#4f46e5;">${d.orderNumber}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:12px;color:#6b7280;font-weight:500;">DATE</span>
        <span style="font-size:13px;color:#374151;">${dateStr}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:12px;color:#6b7280;font-weight:500;">CUSTOMER</span>
        <span style="font-size:13px;color:#374151;">${d.customerName}</span>
      </div>
      ${
        d.tableNumber
          ? `<div style="display:flex;justify-content:space-between;">
               <span style="font-size:12px;color:#6b7280;font-weight:500;">TABLE</span>
               <span style="font-size:13px;color:#374151;">${d.tableNumber.toLowerCase() === "takeaway" ? "🛍 Takeaway" : `Table ${d.tableNumber}`}</span>
             </div>`
          : ""
      }
    </div>

    <!-- Items -->
    <div style="padding:20px 32px;">
      <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Order Items</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;font-size:11px;color:#9ca3af;font-weight:500;padding-bottom:6px;">Item</th>
            <th style="text-align:center;font-size:11px;color:#9ca3af;font-weight:500;padding-bottom:6px;">Qty</th>
            <th style="text-align:right;font-size:11px;color:#9ca3af;font-weight:500;padding-bottom:6px;">Unit</th>
            <th style="text-align:right;font-size:11px;color:#9ca3af;font-weight:500;padding-bottom:6px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:0 32px 20px;border-top:2px dashed #e5e7eb;margin-top:4px;">
      <div style="margin-top:16px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#4b5563;margin-bottom:6px;">
          <span>Subtotal</span><span>${formatIDR(d.subtotal)}</span>
        </div>
        ${
          d.includeDiscount && d.discountAmount > 0
            ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#059669;margin-bottom:6px;">
                 <span>Discount${d.promoCode ? ` (${d.promoCode})` : ""} ${d.discountPercentage > 0 ? `(${d.discountPercentage}%)` : ""}</span>
                 <span>−${formatIDR(d.discountAmount)}</span>
               </div>`
            : ""
        }
        ${
          d.includeTax && d.taxAmount > 0
            ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#d97706;margin-bottom:6px;">
                 <span>Tax (${d.taxPercentage}%)</span><span>+${formatIDR(d.taxAmount)}</span>
               </div>`
            : ""
        }
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#1f2937;margin-top:10px;padding-top:10px;border-top:2px solid #e5e7eb;">
          <span>GRAND TOTAL</span>
          <span style="color:#4f46e5;">${formatIDR(d.grandTotal)}</span>
        </div>
      </div>
    </div>

    <!-- Payments -->
    <div style="padding:16px 32px 20px;background:#f8f7ff;border-top:1px solid #ede9fe;">
      <h3 style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Payment Details</h3>
      ${paymentRows}
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;text-align:center;background:#1e1b4b;">
      <p style="margin:0;color:#a5b4fc;font-size:12px;">Thank you for your visit! 🙏</p>
      <p style="margin:6px 0 0;color:rgba(165,180,252,0.6);font-size:11px;">This is an official digital receipt. Please keep for your records.</p>
    </div>

  </div>
</body>
</html>`;
}

export async function sendReceiptEmail(data: ReceiptEmailData): Promise<void> {
  const transporter = getTransporter();
  const fromName = process.env.SMTP_FROM_NAME ?? data.facilityName;
  const fromEmail = process.env.SMTP_USER!;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: data.to,
    subject: `Your Receipt – ${data.orderNumber} | ${data.facilityName}`,
    html: buildReceiptHtml(data),
    text: [
      `RECEIPT – ${data.orderNumber}`,
      `${data.facilityName}`,
      `Date: ${data.orderDate.toLocaleString("id-ID")}`,
      `Customer: ${data.customerName}`,
      ``,
      `ITEMS:`,
      ...data.items.map((i) => `  ${i.quantity}x ${i.productName} – ${formatIDR(i.totalPrice)}`),
      ``,
      `Subtotal: ${formatIDR(data.subtotal)}`,
      data.includeDiscount && data.discountAmount > 0 ? `Discount: -${formatIDR(data.discountAmount)}` : "",
      data.includeTax && data.taxAmount > 0 ? `Tax: +${formatIDR(data.taxAmount)}` : "",
      `GRAND TOTAL: ${formatIDR(data.grandTotal)}`,
      ``,
      `Thank you!`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
