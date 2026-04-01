import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();
const JSON_HEADERS = { "Content-Type": "application/json" } as const;
const MAX_WEBHOOK_BODY_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_RECORDS_PER_WEBHOOK = 1000;

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function normalizeSignatureHeader(signatureHeader: string): string | null {
  let normalized = signatureHeader.trim().toLowerCase();
  if (normalized.startsWith("sha256=")) {
    normalized = normalized.slice(7);
  }
  return /^[0-9a-f]{64}$/.test(normalized) ? normalized : null;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

type WebhookPayload = {
  run_id: string;
  records: unknown[];
};

function isWebhookPayload(value: unknown): value is WebhookPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as { run_id?: unknown; records?: unknown };
  return typeof payload.run_id === "string" && Array.isArray(payload.records);
}

/**
 * Webhook endpoint for receiving scraped scholarship records.
 * Validates HMAC-SHA256 signature before processing.
 */
http.route({
  path: "/webhook/scrape",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signatureHeader = request.headers.get("X-Webhook-Signature");
    if (!signatureHeader) {
      return jsonResponse(401, { error: "Missing signature" });
    }

    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      console.error("[WEBHOOK] WEBHOOK_SECRET environment variable not set");
      return jsonResponse(500, { error: "Server configuration error" });
    }

    const normalizedSignature = normalizeSignatureHeader(signatureHeader);
    if (!normalizedSignature) {
      return jsonResponse(401, { error: "Invalid signature format" });
    }

    let bodyBytes: Uint8Array;
    try {
      const bodyBuffer = await request.arrayBuffer();
      if (bodyBuffer.byteLength === 0) {
        return jsonResponse(400, { error: "Empty request body" });
      }
      if (bodyBuffer.byteLength > MAX_WEBHOOK_BODY_BYTES) {
        return jsonResponse(413, { error: "Payload too large" });
      }
      bodyBytes = new Uint8Array(bodyBuffer);
    } catch (error) {
      console.error("[WEBHOOK] Failed to read request body", error);
      return jsonResponse(400, { error: "Invalid request body" });
    }

    // Compute expected HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expectedSignatureBytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, bodyBytes));
    const providedSignatureBytes = hexToBytes(normalizedSignature);
    if (!timingSafeEqual(expectedSignatureBytes, providedSignatureBytes)) {
      return jsonResponse(401, { error: "Invalid signature" });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(new TextDecoder().decode(bodyBytes));
    } catch {
      return jsonResponse(400, { error: "Invalid JSON" });
    }

    if (!isWebhookPayload(parsed)) {
      return jsonResponse(400, { error: "Invalid payload shape" });
    }

    if (parsed.records.length === 0) {
      // Skip no-op mutation calls to reduce function usage and cost.
      return jsonResponse(202, {
        success: true,
        inserted: 0,
        updated: 0,
        unchanged: 0,
        skipped: true,
      });
    }

    if (parsed.records.length > MAX_RECORDS_PER_WEBHOOK) {
      return jsonResponse(413, { error: "Too many records in a single webhook payload" });
    }

    try {
      const result = await ctx.runMutation(api.scraping.batchInsertRawRecords, {
        run_id: parsed.run_id as any,
        records: parsed.records as any,
      });

      return jsonResponse(200, {
        success: true,
        received: parsed.records.length,
        ...result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isValidationError = /validation|argument|payload|schema|invalid/i.test(message);
      console.error("[WEBHOOK] Failed to process payload", error);
      return jsonResponse(isValidationError ? 400 : 500, {
        error: isValidationError ? "Invalid payload data" : "Failed to process webhook",
      });
    }
  }),
});

export default http;
