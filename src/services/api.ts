import type { ChatMessage, Deal, Demand, Lot, MarketQuote, MatchScore } from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  return localStorage.getItem("fairtrade_token");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new Error("Backend server is not running. Start it on port 5000 and try again.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API Request Failed");
  }

  return data as T;
}

// ---------- Auth APIs ----------
export async function registerUser(payload: { role: string; name: string; identifier: string; password: string }) {
  return request<{ token: string; user: { id: string; role: "Farmer" | "Buyer"; name: string; identifier: string } }>(
    "/auth/register",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function loginUser(payload: { identifier: string; password: string }) {
  return request<{ token: string; user: { id: string; role: "Farmer" | "Buyer"; name: string; identifier: string } }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function getCurrentUser() {
  return request<{ user: { id: string; role: "Farmer" | "Buyer"; name: string; identifier: string } }>("/auth/me");
}

// ---------- Market Quotes API ----------
export async function getMarketQuotes() {
  return request<MarketQuote[]>("/market-quotes");
}

// ---------- Produce Lots APIs ----------
export async function getLots() {
  return request<Lot[]>("/lots");
}

export async function createLot(payload: Partial<Lot>) {
  return request<Lot>("/lots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Buyer Demands APIs ----------
export async function getDemands() {
  return request<Demand[]>("/demands");
}

export async function createDemand(payload: Partial<Demand>) {
  return request<Demand>("/demands", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Deals APIs ----------
export async function getDeals() {
  return request<Deal[]>("/deals");
}

export async function getDealById(id: string) {
  return request<Deal>(`/deals/${id}`);
}

export async function updateDeal(id: string, patch: Partial<Deal>) {
  return request<Deal>(`/deals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// ---------- Chat APIs ----------
export async function getChatMessages(dealId: string) {
  return request<ChatMessage[]>(`/deals/${dealId}/chat`);
}

export async function sendChatMessage(dealId: string, text: string) {
  return request<ChatMessage>(`/deals/${dealId}/chat`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// ---------- Quality Sample Registration ----------
export async function registerSample(lotId?: string) {
  return request<{ sampleId: string; status: string; message: string }>("/quality/samples", {
    method: "POST",
    body: JSON.stringify({ lotId }),
  });
}

// ---------- Client-side Match Score Helper ----------
export function scoreMatches(demand: Demand, candidateLots: Lot[]): MatchScore[] {
  if (!demand || !candidateLots) return [];
  return candidateLots
    .filter((lot) => lot.crop === demand.crop && lot.city === demand.city)
    .map((lot) => {
      const target = (demand.minPrice + demand.maxPrice) / 2;
      const priceDistance = Math.abs(lot.expectedPrice - target);
      const priceFit = Math.max(58, Math.round(100 - (priceDistance / target) * 100));
      const qualityFit = lot.grade === demand.grade ? 98 : lot.labStatus === "Verified" ? 88 : 74;
      const quantityFit = Math.min(100, Math.round((lot.quantityQt / demand.quantityQt) * 100));
      const reliability = lot.reliability;
      const total = Math.round(priceFit * 0.32 + qualityFit * 0.28 + quantityFit * 0.18 + reliability * 0.22);
      return { lot, priceFit, qualityFit, quantityFit, reliability, total };
    })
    .sort((a, b) => b.total - a.total);
}
