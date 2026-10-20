export interface ItemCalcInput {
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
}

const r4 = (n: number) => Number(n.toFixed(4));
const clampPct = (n: unknown) => Math.max(0, Math.min(100, Number(n) || 0));

/** Mirrors backend `calculateItemTotals` (salesOrderCalculation.ts). */
export function calculateItemTotals(input: ItemCalcInput) {
    const quantity = Number(input.quantity) || 0;
    const unitPrice = Number(input.unitPrice) || 0;
    const discountPercentage = clampPct(input.discountPercentage);
    const gross = quantity * unitPrice;
    const discountAmount = r4((gross * discountPercentage) / 100);
    return { quantity, unitPrice, discountPercentage, discountAmount, totalPrice: r4(gross - discountAmount) };
}

export interface OrderCalcInput {
    subtotal: number;
    includeDiscount?: boolean;
    discountPercentage?: number;
    includeTax?: boolean;
    taxPercentage?: number;
}

/** Mirrors backend `calculateOrderTotals`. Server remains authoritative. */
export function calculateOrderTotals(input: OrderCalcInput) {
    const subtotal = Number(input.subtotal) || 0;
    const includeDiscount = Boolean(input.includeDiscount);
    const discountPercentage = includeDiscount ? clampPct(input.discountPercentage) : 0;
    const discountAmount = includeDiscount ? r4((subtotal * discountPercentage) / 100) : 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const includeTax = Boolean(input.includeTax);
    const taxPercentage = includeTax ? clampPct(input.taxPercentage) : 0;
    const taxAmount = includeTax ? r4((taxableAmount * taxPercentage) / 100) : 0;
    return {
        subtotal,
        includeDiscount,
        discountPercentage,
        discountAmount,
        includeTax,
        taxPercentage,
        taxAmount,
        grandTotal: r4(taxableAmount + taxAmount),
    };
}

/** Change due for cash overpayment. */
export function calculateChange(totalPaid: number, grandTotal: number) {
    return Math.max(0, r4(totalPaid - grandTotal));
}

/** Formats local or international phone numbers to international WhatsApp numbers (e.g. 0812... -> 62812...). */
export function formatWhatsAppNumber(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) {
        cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith("0")) {
        cleaned = "62" + cleaned.substring(1);
    } else if (!cleaned.startsWith("62")) {
        cleaned = "62" + cleaned;
    }
    return cleaned;
}

export interface ReceiptTextDetails {
    orderNumber: string;
    tableNumber?: string | null;
    facilityName?: string | null;
    address?: string | null;
    customerName?: string | null;
    orderDate?: string | Date | null;
    items?: Array<{
        productName?: string;
        name?: string;
        quantity: number;
        totalPrice: number;
        notes?: string | null;
    }> | null;
    subtotal: number;
    grandTotal: number;
    paymentMethod?: string | null;
    status?: string | null;
}

export function generateReceiptTextMessage(details: ReceiptTextDetails): string {
    const outlet = details.facilityName || "Chrono Cafe & Eatery";
    const dateStr = details.orderDate ? new Date(details.orderDate).toLocaleString("id-ID") : new Date().toLocaleString("id-ID");
    const lines: string[] = [
        `🧾 *OFFICIAL SALES RECEIPT*`,
        `📍 *${outlet}*`,
    ];
    if (details.address) {
        lines.push(details.address);
    }
    lines.push(
        `━━━━━━━━━━━━━━━━━━━━`,
        `*Order Reference:* ${details.orderNumber}`,
        `*Table:* 🪑 Table ${details.tableNumber || "-"}`,
        `*Date:* ${dateStr}`,
    );
    if (details.customerName) {
        lines.push(`*Customer:* ${details.customerName}`);
    }
    lines.push(`━━━━━━━━━━━━━━━━━━━━`, `*ITEMS ORDERED:*`);

    if (details.items && details.items.length > 0) {
        for (const item of details.items) {
            const name = item.productName || item.name || "Item";
            lines.push(`• ${item.quantity}x ${name} - Rp ${Number(item.totalPrice).toLocaleString("id-ID")}`);
            if (item.notes) {
                lines.push(`  ↳ Note: "${item.notes}"`);
            }
        }
    }

    lines.push(
        `━━━━━━━━━━━━━━━━━━━━`,
        `*TOTAL PAID: Rp ${Number(details.grandTotal).toLocaleString("id-ID")}*`,
        `*Payment:* ${details.paymentMethod || "PAID (Online)"}`,
        `*Kitchen Status:* In Kitchen • Cooking Now`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `Staff will deliver your freshly prepared order directly to Table ${details.tableNumber || "-"}.`,
        `Thank you for dining with us! 🙏`,
    );

    return lines.join("\n");
}

