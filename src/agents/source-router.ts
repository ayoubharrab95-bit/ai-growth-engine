/**
 * Resilient source execution for MoneyHunter-style workflows.
 *
 * This module does not bypass authentication, CAPTCHAs, robots rules, paywalls,
 * rate limits, or platform security. It only fails over between explicitly
 * configured sources and retries transient transport/server failures.
 */

export type Source = {
  name: string;
  url: string;
  enabled?: boolean;
  timeoutMs?: number;
  maxAttempts?: number;
};

export type SourceAttempt = {
  source: string;
  ok: boolean;
  status?: number;
  error?: string;
  attempts: number;
};

export type SourceResult<T> = {
  value: T;
  source: string;
  attempts: SourceAttempt[];
};

const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(
  source: Source,
  parse: (response: Response) => Promise<T>,
): Promise<{ value: T; attempt: SourceAttempt }> {
  const maxAttempts = Math.max(1, source.maxAttempts ?? 3);
  const timeoutMs = Math.max(1000, source.timeoutMs ?? 15000);
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(source.url, {
        method: "GET",
        headers: {
          "accept": "application/json,text/html;q=0.9,*/*;q=0.8",
          "user-agent": "MoneyHunter/1.0 (+resilient-source-router)",
        },
        signal: controller.signal,
      });

      if (response.ok) {
        const value = await parse(response);
        clearTimeout(timer);
        return {
          value,
          attempt: { source: source.name, ok: true, status: response.status, attempts: attempt },
        };
      }

      lastError = `HTTP ${response.status}`;
      clearTimeout(timer);

      if (!TRANSIENT_STATUS.has(response.status) || attempt === maxAttempts) {
        break;
      }
    } catch (error) {
      clearTimeout(timer);
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt === maxAttempts) break;
    }

    await sleep(Math.min(2000 * 2 ** (attempt - 1), 8000));
  }

  return {
    value: undefined as T,
    attempt: {
      source: source.name,
      ok: false,
      error: lastError,
      attempts: maxAttempts,
    },
  };
}

/**
 * Try sources in order. A failed source never blocks the next source.
 * Returns the first successful result; throws only after all enabled sources fail.
 */
export async function executeWithFallback<T>(
  sources: Source[],
  parse: (response: Response) => Promise<T>,
): Promise<SourceResult<T>> {
  const attempts: SourceAttempt[] = [];
  const enabled = sources.filter((source) => source.enabled !== false);

  if (enabled.length === 0) {
    throw new Error("No enabled sources configured.");
  }

  for (const source of enabled) {
    const result = await request(source, parse);
    attempts.push(result.attempt);

    if (result.attempt.ok) {
      return { value: result.value, source: source.name, attempts };
    }
  }

  const summary = attempts
    .map((a) => `${a.source}: ${a.error ?? `HTTP ${a.status}`}`)
    .join("; ");

  throw new Error(`All configured sources failed. ${summary}`);
}

/**
 * Safe JSON helper for public source endpoints.
 */
export function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
