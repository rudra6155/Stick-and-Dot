export interface PredictionEvent {
  id: string;
  title: string;
  category: "Sports" | "Startup" | "Equities" | "Crypto";
  status: "Open" | "Closed" | "Resolved";
  resolutionDate: string;
  outcomes: { label: string; odds: number; probability: number }[];
  poolSize?: number;
}

export async function fetchLiveMarkets(): Promise<PredictionEvent[]> {
  try {
    const res = await fetch("/api/odds");
    if (!res.ok) {
      console.error(`Failed to fetch odds from oracle: HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    // Guard against malformed/unexpected payloads so callers can always safely
    // call array methods (.filter, .map, etc.) on the result.
    return Array.isArray(data?.data) ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch odds from oracle", error);
    return [];
  }
}
