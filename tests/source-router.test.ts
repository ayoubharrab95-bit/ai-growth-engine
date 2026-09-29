import { executeWithFallback } from "../src/agents/source-router.ts";

function mockFetch(statuses: number[]) {
  let i = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    const status = statuses[Math.min(i++, statuses.length - 1)];
    return new Response(JSON.stringify({ status }), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return () => { globalThis.fetch = original; };
}

Deno.test("falls back after a transient source failure", async () => {
  const restore = mockFetch([503]);
  try {
    const result = await executeWithFallback(
      [
        { name: "blocked-source", url: "https://example.invalid/a", maxAttempts: 1 },
        { name: "fallback-source", url: "https://example.invalid/b", maxAttempts: 1 },
      ],
      async (response) => response.json(),
    );
    if (result.source !== "fallback-source") throw new Error("did not use fallback");
  } finally {
    restore();
  }
});

Deno.test("does not retry permanent client errors", async () => {
  let calls = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    calls++;
    return new Response("forbidden", { status: 403 });
  }) as typeof fetch;

  try {
    await executeWithFallback(
      [{ name: "source", url: "https://example.invalid", maxAttempts: 3 }],
      async (response) => response.text(),
    ).then(() => { throw new Error("expected failure"); })
      .catch(() => undefined);

    if (calls !== 1) throw new Error(`expected 1 call, got ${calls}`);
  } finally {
    globalThis.fetch = original;
  }
});
