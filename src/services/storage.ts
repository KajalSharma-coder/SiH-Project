import { deals, demands, lots } from "../data/mockData";
import type { ChatMessage, Deal, Demand, DemoSession, Lot, MatchScore } from "../types";

const LOTS_KEY = "fairtrade-lots";
const DEMANDS_KEY = "fairtrade-demands";
const DEALS_KEY = "fairtrade-deals";
const SESSION_KEY = "fairtrade-session";
const CHAT_KEY = "fairtrade-chat";

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLots() {
  return read<Lot[]>(LOTS_KEY, lots);
}

export function saveLot(lot: Lot) {
  const next = [lot, ...getLots()];
  write(LOTS_KEY, next);
  return next;
}

export function getDemands() {
  return read<Demand[]>(DEMANDS_KEY, demands);
}

export function saveDemand(demand: Demand) {
  const next = [demand, ...getDemands()];
  write(DEMANDS_KEY, next);
  return next;
}

export function getDeals() {
  return read<Deal[]>(DEALS_KEY, deals).map((deal) => ({
    ...deal,
    transactionMode: deal.transactionMode ?? "Use FairTrade",
  }));
}

export function updateDeal(id: string, patch: Partial<Deal>) {
  const next = getDeals().map((deal) => (deal.id === id ? { ...deal, ...patch } : deal));
  write(DEALS_KEY, next);
  return next.find((deal) => deal.id === id);
}

export function getSession() {
  return read<DemoSession | null>(SESSION_KEY, null);
}

export function saveSession(session: DemoSession) {
  write(SESSION_KEY, session);
  return session;
}

export function getChatMessages(dealId: string) {
  return read<ChatMessage[]>(CHAT_KEY, []).filter((message) => message.dealId === dealId);
}

export function saveChatMessage(message: ChatMessage) {
  const next = [...read<ChatMessage[]>(CHAT_KEY, []), message];
  write(CHAT_KEY, next);
  return next.filter((item) => item.dealId === message.dealId);
}

export function scoreMatches(demand: Demand, candidateLots = getLots()): MatchScore[] {
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
