export type Crop = "Wheat" | "Rice" | "Mustard" | "Maize" | "Gram";

export type Grade = "FAQ" | "A" | "Premium" | "Lab Verified" | "Organic";

export type ForecastPoint = {
  label: string;
  actual?: number;
  predicted?: number;
  low: number;
  high: number;
  confidence: number;
};

export type MarketQuote = {
  id: string;
  state: string;
  city: string;
  mandi: string;
  crop: Crop;
  grade: Grade;
  currentPrice: number;
  change: number;
  high: number;
  low: number;
  updatedAt: string;
  confidence: number;
  forecast: ForecastPoint[];
};

export type Lot = {
  id: string;
  farmerId: string;
  farmerName: string;
  crop: Crop;
  grade: Grade;
  declaredQuality: string;
  labStatus: "Pending" | "Submitted" | "Verified";
  quantityQt: number;
  expectedPrice: number;
  city: string;
  mandi: string;
  reliability: number;
  status: "Active" | "Matched" | "In Deal" | "Sold";
};

export type Demand = {
  id: string;
  buyerId: string;
  buyerName: string;
  crop: Crop;
  grade: Grade;
  quantityQt: number;
  minPrice: number;
  maxPrice: number;
  city: string;
  mandi: string;
};

export type MatchScore = {
  lot: Lot;
  priceFit: number;
  qualityFit: number;
  quantityFit: number;
  reliability: number;
  total: number;
};

export type Deal = {
  id: string;
  farmer: string;
  buyer: string;
  lotId: string;
  crop: Crop;
  quantityQt: number;
  grade: Grade;
  agreedPrice: number;
  offer: number;
  counterOffer: number;
  paymentGiven: boolean;
  paymentReceived: boolean;
  transactionMode: "Direct Deal" | "Use FairTrade";
  status: "Offer Sent" | "Negotiating" | "Payment Pending" | "Completed";
  date: string;
};

export type Activity = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

export type SessionRole = "Farmer" | "Buyer";

export type DemoSession = {
  role: SessionRole;
  name: string;
  phone: string;
  signedInAt: string;
};

export type ChatMessage = {
  id: string;
  dealId: string;
  sender: string;
  text: string;
  time: string;
};
