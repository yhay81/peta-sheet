import { describe, expect, it } from "vitest";

import { app } from "../src/worker";

type RecordedStatement = { parameters: unknown[]; sql: string };

function bindings(recorded: RecordedStatement[] = []) {
  return {
    ASSETS: {
      fetch: () => Promise.resolve(new Response("not used")),
    },
    DB: {
      batch: () => Promise.resolve([]),
      prepare(sql: string) {
        const entry: RecordedStatement = { parameters: [], sql };
        recorded.push(entry);
        const statement = {
          bind(...parameters: unknown[]) {
            entry.parameters = parameters;
            return statement;
          },
          run: () => Promise.resolve({ success: true }),
        };
        return statement;
      },
    } as unknown as D1Database,
  };
}

describe("worker", () => {
  it("renders the label workspace as the primary Japanese interface", async () => {
    const response = await app.request("/", undefined, bindings());
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(html).toContain('lang="ja"');
    expect(html).toContain('class="label-workspace"');
    expect(html).toContain("宛名 12面");
    expect(html).toContain("小物 65面");
    expect(html).toContain("A4で印刷する");
    expect(html).not.toContain('class="hero"');
    expect(html).not.toContain("PUBLIC VALIDATION");
    expect(html).not.toContain("成功条件");
  });

  it("explains that label text remains on the device", async () => {
    const response = await app.request("/privacy", undefined, bindings());
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("ラベルの文字はサーバーへ送りません");
    expect(html).toContain("35日後に自動削除");
  });

  it("stores only a hashed anonymous event id", async () => {
    const recorded: RecordedStatement[] = [];
    const response = await app.request(
      "/api/events",
      {
        body: JSON.stringify({
          name: "printed",
          sessionId: "9b6a29ae-aa5f-4fe7-a7dd-3ea1a7664a0f",
        }),
        headers: {
          "content-type": "application/json",
          "sec-fetch-site": "same-origin",
        },
        method: "POST",
      },
      bindings(recorded),
    );

    expect(response.status).toBe(204);
    expect(recorded[0]?.sql).toContain("INSERT OR IGNORE");
    expect(recorded[0]?.parameters[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(recorded[0]?.parameters[0]).not.toBe("9b6a29ae-aa5f-4fe7-a7dd-3ea1a7664a0f");
    expect(recorded[0]?.parameters[1]).toBe("printed");
  });

  it("rejects unknown or cross-site events", async () => {
    const invalidName = await app.request(
      "/api/events",
      {
        body: JSON.stringify({
          name: "label_content",
          sessionId: "9b6a29ae-aa5f-4fe7-a7dd-3ea1a7664a0f",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      },
      bindings(),
    );
    const crossSite = await app.request(
      "/api/events",
      {
        body: JSON.stringify({
          name: "visited",
          sessionId: "9b6a29ae-aa5f-4fe7-a7dd-3ea1a7664a0f",
        }),
        headers: {
          "content-type": "application/json",
          "sec-fetch-site": "cross-site",
        },
        method: "POST",
      },
      bindings(),
    );

    expect(invalidName.status).toBe(400);
    expect(crossSite.status).toBe(403);
  });

  it("exposes a machine-readable health endpoint", async () => {
    const response = await app.request("/healthz", undefined, bindings());
    const body = await response.json<{ healthy: boolean }>();

    expect(response.status).toBe(200);
    expect(body.healthy).toBe(true);
  });

  it("does not expose exception details", async () => {
    const response = await app.request("/missing", undefined, bindings());
    const body = await response.json<{ error: string; requestId: string }>();

    expect(response.status).toBe(404);
    expect(body.error).toBe("not_found");
    expect(body.requestId).toBeTruthy();
  });
});
