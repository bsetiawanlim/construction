/**
 * Helper utilities for customer-facing Table Ordering:
 * 1. Stripping internal recipe/BOM specifications from product descriptions
 * 2. URL-safe Base64 token encoding & decoding for table menu URLs (?code=...)
 */

export interface DecodedTableToken {
  facilityId: number;
  tableNumber: string;
}

/**
 * Strips internal recipe specification markers and payloads (---RECIPE_SPEC_START--- ... ---RECIPE_SPEC_END---)
 * from a raw product description string so proprietary formulas and recipes are never shown on customer menus.
 */
export function cleanProductDescription(desc?: string | null): string {
  if (!desc) return "";
  return desc.replace(/---RECIPE_SPEC_START---[\s\S]*?(---RECIPE_SPEC_END---|$)/g, "").trim();
}

/**
 * Universal base64 encoder that works across Node.js, Next.js browser, and React Native (Expo).
 */
function toBase64(str: string): string {
  const g = globalThis as any;
  if (typeof g.Buffer !== "undefined") {
    return g.Buffer.from(str, "utf-8").toString("base64");
  }
  if (typeof btoa !== "undefined") {
    const encoded = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    return btoa(encoded);
  }
  return "";
}

/**
 * Universal base64 decoder that works across Node.js, Next.js browser, and React Native (Expo).
 */
function fromBase64(b64: string): string {
  const g = globalThis as any;
  if (typeof g.Buffer !== "undefined") {
    return g.Buffer.from(b64, "base64").toString("utf-8");
  }
  if (typeof atob !== "undefined") {
    const binary = atob(b64);
    try {
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch {
      return binary;
    }
  }
  return "";
}

/**
 * Encodes facilityId and tableNumber into a compact, URL-safe Base64 token
 * so that menu URLs use an encoded parameter instead of plaintext facility IDs and table numbers.
 */
export function encodeTableToken(facilityId: number, tableNumber: string): string {
  const payload = JSON.stringify({
    f: facilityId,
    t: String(tableNumber || "").trim(),
    v: 1,
  });

  const b64 = toBase64(payload);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decodes a URL-safe Base64 table token back into { facilityId, tableNumber }.
 * Returns null if the token is invalid or malformed.
 */
export function decodeTableToken(token: string): DecodedTableToken | null {
  if (!token) return null;
  const trimmed = token.trim();
  if (!trimmed) return null;

  try {
    let normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4 !== 0) {
      normalized += "=";
    }

    const decoded = fromBase64(normalized);
    if (!decoded) return null;

    // Check if JSON format
    if (decoded.startsWith("{") && decoded.endsWith("}")) {
      const parsed = JSON.parse(decoded);
      const f =
        parsed.f !== undefined
          ? Number(parsed.f)
          : parsed.facilityId !== undefined
          ? Number(parsed.facilityId)
          : null;
      const t =
        parsed.t !== undefined
          ? String(parsed.t)
          : parsed.tableNumber !== undefined
          ? String(parsed.tableNumber)
          : null;
      if (f && t) {
        return { facilityId: f, tableNumber: t.trim() };
      }
    }

    // Check delimited format: "facilityId:tableNumber"
    const colonIdx = decoded.indexOf(":");
    if (colonIdx > 0) {
      const fStr = decoded.substring(0, colonIdx);
      const tStr = decoded.substring(colonIdx + 1);
      const fNum = Number(fStr);
      if (!isNaN(fNum) && fNum > 0 && tStr.trim()) {
        return { facilityId: fNum, tableNumber: tStr.trim() };
      }
    }
  } catch (err) {
    // Malformed token, return null safely
  }

  return null;
}
