import { httpAction } from "./_generated/server";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Webhook endpoint for receiving scraped scholarship records.
 * Validates HMAC-SHA256 signature before processing.
 */
http.route({
  path: "/webhook/scrape",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify HMAC signature
    const signature = request.headers.get("X-Webhook-Signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      console.error("[WEBHOOK] WEBHOOK_SECRET environment variable not set");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.text();

    // Compute expected HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSignature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and process the payload
    const payload = JSON.parse(body);
    const result = await ctx.runMutation(internal.scraping.batchInsertRawRecords, {
      run_id: payload.run_id,
      records: payload.records,
    });

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
