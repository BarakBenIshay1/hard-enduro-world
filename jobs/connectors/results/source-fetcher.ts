import type {
  OfficialResultsFetchResult,
  ResultsConnectorConfig,
  ResultsPayloadType,
} from "@/jobs/connectors/results/types";

export async function fetchOfficialResultsSource(
  config: ResultsConnectorConfig,
): Promise<OfficialResultsFetchResult> {
  if (!process.env.OFFICIAL_RESULTS_URL) {
    return {
      mode: "demo",
      connectorStatus: "missing-config",
      sourceStatus: "not-configured",
      payloadType: "unknown",
      sourceUrl: config.sourceUrl,
      fetchedAt: new Date(),
      rawContent: "",
      results: [],
      errorMessage: "OFFICIAL_RESULTS_URL is required for real result imports.",
    };
  }

  try {
    const response = await fetch(config.sourceUrl);
    const contentType = response.headers.get("content-type") ?? "";
    const payloadType = detectPayloadType(config.sourceUrl, contentType);

    if (payloadType === "pdf-metadata") {
      return {
        mode: "api",
        connectorStatus: "configured",
        sourceStatus: response.ok ? "available" : "error",
        payloadType,
        sourceUrl: config.sourceUrl,
        fetchedAt: new Date(),
        rawContent: JSON.stringify({
          contentType,
          status: response.status,
          note: "PDF detected. Metadata only; PDF parsing is intentionally not implemented in Step 28.",
        }),
        results: [],
        errorMessage: response.ok
          ? "PDF source detected. Metadata captured, but PDF parsing is not implemented yet."
          : `Official results PDF metadata fetch failed with HTTP ${response.status}.`,
      };
    }

    const rawContent = await response.text();

    if (!response.ok) {
      return {
        mode: "api",
        connectorStatus: "error",
        sourceStatus: "error",
        payloadType,
        sourceUrl: config.sourceUrl,
        fetchedAt: new Date(),
        rawContent,
        results: [],
        errorMessage: `Official results fetch failed with HTTP ${response.status}.`,
      };
    }

    return {
      mode: "api",
      connectorStatus: "configured",
      sourceStatus: "available",
      payloadType,
      sourceUrl: config.sourceUrl,
      fetchedAt: new Date(),
      rawContent,
      results: [],
    };
  } catch (error) {
    return {
      mode: "api",
      connectorStatus: "error",
      sourceStatus: "error",
      payloadType: "unknown",
      sourceUrl: config.sourceUrl,
      fetchedAt: new Date(),
      rawContent: "",
      results: [],
      errorMessage:
        error instanceof Error ? error.message : "Unknown official results fetch error.",
    };
  }
}

function detectPayloadType(url: string, contentType: string): ResultsPayloadType {
  const normalizedType = contentType.toLowerCase();
  const normalizedUrl = url.toLowerCase();

  if (normalizedType.includes("pdf") || normalizedUrl.endsWith(".pdf")) {
    return "pdf-metadata";
  }

  if (normalizedType.includes("json") || normalizedUrl.endsWith(".json")) {
    return "json";
  }

  if (
    normalizedType.includes("csv") ||
    normalizedType.includes("text/plain") ||
    normalizedUrl.endsWith(".csv")
  ) {
    return "csv";
  }

  if (normalizedType.includes("html") || normalizedUrl.endsWith(".html")) {
    return "html";
  }

  return "unknown";
}
