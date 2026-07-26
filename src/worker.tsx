import { Hono } from "hono";
import { requestId } from "hono/request-id";

import { securityHeaders } from "./middleware/security";
import { HomePage, PrivacyPage } from "./ui/pages";

export type Bindings = {
  ASSETS: Fetcher;
  DB: D1Database;
};

const eventNames = new Set(["visited", "edited", "adjusted", "printed", "returned"]);
const sessionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const app = new Hono<{ Bindings: Bindings }>();

app.use("*", requestId());
app.use("*", securityHeaders);

app.get("/", (c) => c.html(<HomePage />));
app.get("/privacy", (c) => c.html(<PrivacyPage />));

app.post("/api/events", async (c) => {
  c.header("Cache-Control", "no-store");
  const contentLength = Number(c.req.header("content-length") ?? "0");
  if (contentLength > 1024) {
    return c.json({ error: "payload_too_large" }, 413);
  }
  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return c.json({ error: "unsupported_media_type" }, 415);
  }
  const fetchSite = c.req.header("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return c.json({ error: "cross_site_request" }, 403);
  }

  let payload: unknown;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  if (!payload || typeof payload !== "object") {
    return c.json({ error: "invalid_event" }, 400);
  }
  const { name, sessionId } = payload as Record<string, unknown>;
  if (
    typeof name !== "string" ||
    !eventNames.has(name) ||
    typeof sessionId !== "string" ||
    !sessionIdPattern.test(sessionId)
  ) {
    return c.json({ error: "invalid_event" }, 400);
  }

  const sessionHash = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sessionId))),
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const occurredOn = new Date().toISOString().slice(0, 10);
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT OR IGNORE INTO product_events
        (session_hash, name, occurred_on)
       VALUES (?, ?, ?)`,
    ).bind(sessionHash, name, occurredOn),
    c.env.DB.prepare("DELETE FROM product_events WHERE created_at < unixepoch() - (35 * 86400)"),
  ]);
  return c.body(null, 204);
});

app.get("/healthz", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({
    healthy: true,
    service: "peta-sheet",
    time: new Date().toISOString(),
  });
});

app.notFound((c) =>
  c.json(
    {
      error: "not_found",
      requestId: c.get("requestId"),
    },
    404,
  ),
);

app.onError((error, c) => {
  console.error(
    JSON.stringify({
      event: "request_failed",
      message: error.message,
      requestId: c.get("requestId"),
    }),
  );

  return c.json(
    {
      error: "internal_error",
      requestId: c.get("requestId"),
    },
    500,
  );
});

export { app };
export default {
  fetch: app.fetch,
  scheduled(_controller: ScheduledController, env: Bindings, context: ExecutionContext) {
    context.waitUntil(
      env.DB.prepare(
        "DELETE FROM product_events WHERE created_at < unixepoch() - (35 * 86400)",
      ).run(),
    );
  },
};
