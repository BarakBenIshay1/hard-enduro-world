export type FimCalendarFetchOptions = {
  url: string;
  seasonYear: number;
  timeoutMs?: number;
  retries?: number;
  userAgent?: string;
  fetchImpl?: typeof fetch;
};

export type FimCalendarFetchResult =
  | {
      ok: true;
      requestedUrl: string;
      url: string;
      status: number;
      contentType: string | null;
      rawContent: string;
      responseSizeBytes: number;
      elapsedMs: number;
      attempts: number;
      endpointDiscovered: boolean;
      endpointUrl: string | null;
    }
  | {
      ok: false;
      requestedUrl: string;
      url: string;
      status: number | null;
      contentType: string | null;
      errorCode: "invalid-url" | "timeout" | "http-error" | "network-error";
      errorMessage: string;
      elapsedMs: number;
      attempts: number;
    };

const defaultTimeoutMs = 8_000;
const defaultRetries = 2;
const defaultUserAgent =
  "HardEnduroWorld/1.0 FIMCalendarDryRun (+https://hard-enduro-world.local; dry-run)";

export async function fetchFimCalendarOfficialSource({
  url,
  seasonYear,
  timeoutMs = defaultTimeoutMs,
  retries = defaultRetries,
  userAgent = defaultUserAgent,
  fetchImpl = fetch,
}: FimCalendarFetchOptions): Promise<FimCalendarFetchResult> {
  const startedAt = Date.now();
  const parsedUrl = parseOfficialUrl(url);

  if (!parsedUrl) {
    return {
      ok: false,
      requestedUrl: url,
      url,
      status: null,
      contentType: null,
      errorCode: "invalid-url",
      errorMessage: "Official calendar URL must be a valid http(s) URL.",
      elapsedMs: Date.now() - startedAt,
      attempts: 0,
    };
  }

  let lastFailure: Exclude<FimCalendarFetchResult, { ok: true }> | null = null;
  const maxAttempts = Math.max(1, retries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await requestSource(
        fetchImpl,
        parsedUrl.href,
        userAgent,
        controller,
      );
      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        lastFailure = {
          ok: false,
          requestedUrl: parsedUrl.href,
          url: parsedUrl.href,
          status: response.status,
          contentType,
          errorCode: "http-error",
          errorMessage: `Official calendar fetch returned HTTP ${response.status}.`,
          elapsedMs: Date.now() - startedAt,
          attempts: attempt,
        };

        if (!shouldRetryStatus(response.status) || attempt === maxAttempts) {
          return lastFailure;
        }
        await delay(retryDelayMs(attempt));
        continue;
      }

      const firstContent = await response.text();
      const calendarEndpoint = discoverFimCalendarEndpoint(
        firstContent,
        response.url || parsedUrl.href,
        seasonYear,
      );

      if (calendarEndpoint) {
        const endpointResponse = await requestSource(
          fetchImpl,
          calendarEndpoint,
          userAgent,
          controller,
          response.url || parsedUrl.href,
        );
        const endpointContentType = endpointResponse.headers.get("content-type");

        if (!endpointResponse.ok) {
          return {
            ok: false,
            requestedUrl: parsedUrl.href,
            url: endpointResponse.url || calendarEndpoint,
            status: endpointResponse.status,
            contentType: endpointContentType,
            errorCode: "http-error",
            errorMessage: `Official calendar endpoint returned HTTP ${endpointResponse.status}.`,
            elapsedMs: Date.now() - startedAt,
            attempts: attempt,
          };
        }

        const endpointContent = await endpointResponse.text();
        return {
          ok: true,
          requestedUrl: parsedUrl.href,
          url: endpointResponse.url || calendarEndpoint,
          status: endpointResponse.status,
          contentType: endpointContentType,
          rawContent: endpointContent,
          responseSizeBytes: Buffer.byteLength(endpointContent, "utf8"),
          elapsedMs: Date.now() - startedAt,
          attempts: attempt,
          endpointDiscovered: true,
          endpointUrl: calendarEndpoint,
        };
      }

      return {
        ok: true,
        requestedUrl: parsedUrl.href,
        url: response.url || parsedUrl.href,
        status: response.status,
        contentType,
        rawContent: firstContent,
        responseSizeBytes: Buffer.byteLength(firstContent, "utf8"),
        elapsedMs: Date.now() - startedAt,
        attempts: attempt,
        endpointDiscovered: false,
        endpointUrl: null,
      };
    } catch (error) {
      const isTimeout = isAbortError(error);
      lastFailure = {
        ok: false,
        requestedUrl: parsedUrl.href,
        url: parsedUrl.href,
        status: null,
        contentType: null,
        errorCode: isTimeout ? "timeout" : "network-error",
        errorMessage: isTimeout
          ? `Official calendar fetch timed out after ${timeoutMs}ms.`
          : `Official calendar fetch failed: ${formatError(error)}`,
        elapsedMs: Date.now() - startedAt,
        attempts: attempt,
      };

      if (attempt === maxAttempts) return lastFailure;
      await delay(retryDelayMs(attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  return (
    lastFailure ?? {
      ok: false,
      requestedUrl: parsedUrl.href,
      url: parsedUrl.href,
      status: null,
      contentType: null,
      errorCode: "network-error",
      errorMessage: "Official calendar fetch failed before a request was made.",
      elapsedMs: Date.now() - startedAt,
      attempts: maxAttempts,
    }
  );
}

function requestSource(
  fetchImpl: typeof fetch,
  url: string,
  userAgent: string,
  controller: AbortController,
  referer?: string,
) {
  return fetchImpl(url, {
    method: "GET",
    headers: {
      accept:
        "text/calendar, application/json, text/html, application/ld+json, */*;q=0.8",
      "user-agent": userAgent,
      ...(referer
        ? {
            referer,
            "x-requested-with": "XMLHttpRequest",
          }
        : {}),
    },
    redirect: "follow",
    signal: controller.signal,
  });
}

function discoverFimCalendarEndpoint(
  rawContent: string,
  baseUrl: string,
  seasonYear: number,
) {
  const dataUrl = rawContent.match(
    /id=["']championship-calendar["'][\s\S]*?data-url=["']([^"']+)["']/i,
  )?.[1];
  const calendarUrl =
    dataUrl ?? rawContent.match(/data-url=["']([^"']*\/en\/calendars[^"']+)["']/i)?.[1];

  if (!calendarUrl) return null;

  return withRequestedSeason(decodeHtml(calendarUrl), baseUrl, seasonYear);
}

function withRequestedSeason(value: string, baseUrl: string, seasonYear: number) {
  const url = new URL(value, baseUrl);

  for (const key of [...url.searchParams.keys()]) {
    const values = url.searchParams.getAll(key);
    if (key.includes("[year]") || values.some((item) => item.startsWith("year:"))) {
      url.searchParams.delete(key);
    }
  }

  url.searchParams.set("tx_solr[filter][year]", `year:${seasonYear}`);
  url.searchParams.set("tx_solr[facet]", "year");
  url.searchParams.set("tx_solr[view]", "event");
  return url.href;
}

function parseOfficialUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

function shouldRetryStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function retryDelayMs(attempt: number) {
  return Math.min(1_000 * attempt, 3_000);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown network error";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
