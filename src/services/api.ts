import type { ChatMessage, Deal, DealOffer, Demand, Lot, Market, MarketQuote, MatchScore, MLPredictionRequest, MLPredictionResponse } from "../types";

const DEV_API_BASE_URL = "http://localhost:5000/api";

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  const apiBaseUrl = configuredUrl || (import.meta.env.DEV ? DEV_API_BASE_URL : "");
  return apiBaseUrl.replace(/\/+$/, "");
}

const API_BASE_URL = getApiBaseUrl();

function getToken(): string | null {
  return localStorage.getItem("fairtrade_token");
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("VITE_API_URL is required for production API requests.", 0);
  }

  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Backend server is unavailable. Check VITE_API_URL and try again.", 0);
  }

  const rawBody = await response.text();
  let data: unknown = null;
  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = rawBody;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data
        ? String(data.error)
        : typeof data === "object" && data !== null && "message" in data
          ? String(data.message)
          : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

/** Shared JSON client for all API communication, including authenticated CRUD calls. */
export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) => request<T>(endpoint, { ...options, method: "POST", body }),
  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) => request<T>(endpoint, { ...options, method: "PUT", body }),
  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) => request<T>(endpoint, { ...options, method: "PATCH", body }),
  delete: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) => request<T>(endpoint, { ...options, method: "DELETE" }),
};

// ---------- Auth APIs ----------
export async function registerUser(payload: { role: string; name: string; identifier: string; password: string }) {
  return request<{ token: string; user: { id: string; role: "Farmer" | "Buyer"; name: string; identifier: string } }>(
    "/auth/register",
    { method: "POST", body: payload }
  );
}

export async function loginUser(payload: { identifier: string; password: string }) {
  return request<{ token: string; user: { id: string; role: "Farmer" | "Buyer"; name: string; identifier: string } }>(
    "/auth/login",
    { method: "POST", body: payload }
  );
}

export async function getCurrentUser() {
  return request<{ user: { id: string; role: "Farmer" | "Buyer"; name: string; identifier: string } }>("/auth/me");
}

// ---------- Market Quotes API ----------
export async function getMarketQuotes() {
  return request<MarketQuote[]>("/market-quotes");
}

export async function getMarkets() {
  return request<Market[]>("/markets");
}

export async function getMlPrediction(payload: MLPredictionRequest) {
  const response = await request<{
    crop: string;
    state: string;
    district: string;
    market: string;
    prediction_days: number;
    current_price: number;
    predictions: Array<{ date: string; predicted_price: number; low: number; high: number; confidence: number }>;
    trained_at?: string;
    database_warning?: string | null;
  }>("/ml/predict", {
    method: "POST",
    body: {
      crop: payload.crop,
      state: payload.state,
      district: payload.district,
      market: payload.market,
      prediction_days: payload.predictionDays,
    },
  });

  return {
    crop: response.crop,
    state: response.state,
    district: response.district,
    market: response.market,
    predictionDays: response.prediction_days,
    currentPrice: response.current_price,
    predictions: response.predictions.map((point) => ({
      date: point.date,
      predictedPrice: point.predicted_price,
      low: point.low,
      high: point.high,
      confidence: point.confidence,
    })),
    trainedAt: response.trained_at,
    databaseWarning: response.database_warning,
  } satisfies MLPredictionResponse;
}

// ---------- Produce Lots APIs ----------
export async function getLots() {
  return request<Lot[]>("/lots");
}

export async function createLot(payload: Partial<Lot>) {
  return request<Lot>("/lots", {
    method: "POST",
    body: payload,
  });
}

export async function deleteLot(id: string) {
  return request<{ ok: true; id: string }>(`/lots/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ---------- Buyer Demands APIs ----------
export async function getDemands() {
  return request<Demand[]>("/demands");
}

export async function createDemand(payload: Partial<Demand>) {
  return request<Demand>("/demands", {
    method: "POST",
    body: payload,
  });
}

// ---------- Deals APIs ----------
export async function getDeals() {
  return request<Deal[]>("/deals");
}

export async function getDealById(id: string) {
  return request<Deal>(`/deals/${id}`);
}

export async function startDeal(payload: { lotId: string; quantity: number; pricePerUnit: number; message?: string }) {
  return request<Deal>("/deals", {
    method: "POST",
    body: payload,
  });
}

export async function updateDeal(id: string, patch: Partial<Deal>) {
  return request<Deal>(`/deals/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

export async function getDealOffers(dealId: string) {
  return request<DealOffer[]>(`/deals/${dealId}/offers`);
}

export async function sendDealOffer(dealId: string, payload: { quantity: number; pricePerUnit: number; message?: string }) {
  return request<DealOffer>(`/deals/${dealId}/offers`, {
    method: "POST",
    body: payload,
  });
}

export async function sendCounterOffer(dealId: string, payload: { quantity: number; pricePerUnit: number; message?: string }) {
  return request<DealOffer>(`/deals/${dealId}/counter`, {
    method: "POST",
    body: payload,
  });
}

export async function acceptDealOffer(dealId: string) {
  return request<Deal>(`/deals/${dealId}/accept`, { method: "POST" });
}

export async function rejectDealOffer(dealId: string) {
  return request<Deal>(`/deals/${dealId}/reject`, { method: "POST" });
}

export async function markPaymentSent(dealId: string) {
  return request<Deal>(`/deals/${dealId}/payment-sent`, { method: "POST" });
}

export async function markPaymentReceived(dealId: string) {
  return request<Deal>(`/deals/${dealId}/payment-received`, { method: "POST" });
}

// ---------- Chat APIs ----------
export async function getChatMessages(dealId: string) {
  return request<ChatMessage[]>(`/deals/${dealId}/messages`);
}

export async function sendChatMessage(dealId: string, text: string) {
  return request<ChatMessage>(`/deals/${dealId}/messages`, {
    method: "POST",
    body: { message: text },
  });
}

// ---------- Quality Sample Registration ----------
export async function registerSample(lotId?: string) {
  return request<{ sampleId: string; status: string; message: string }>("/quality/samples", {
    method: "POST",
    body: { lotId },
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
