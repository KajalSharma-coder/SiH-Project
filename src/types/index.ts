export type Crop = "Wheat" | "Rice" | "Mustard" | "Maize" | "Gram";

export type Grade = "FAQ" | "A" | "Premium" | "Lab Verified" | "Organic";

export type ForecastPoint = {
  label: string;
  price?: number;
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

export type Market = {
  id: string;
  state: string;
  city: string;
  name: string;
};

export type MLPredictionRequest = {
  crop: string;
  state: string;
  district: string;
  market: string;
  predictionDays: number;
};

export type MLPredictionPoint = {
  date: string;
  predictedPrice: number;
  low: number;
  high: number;
  confidence: number;
};

export type MLPredictionResponse = {
  crop: string;
  state: string;
  district: string;
  market: string;
  predictionDays: number;
  currentPrice: number;
  predictions: MLPredictionPoint[];
  trainedAt?: string;
  databaseWarning?: string | null;
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
  marketId?: string;
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
  marketId?: string;
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
  farmerId: string;
  buyerId: string;
  lotId: string;
  marketId?: string;
  marketState: string;
  marketName: string;
  marketCity: string;
  crop: Crop;
  quantityQt: number;
  grade: Grade;
  agreedPrice: number;
  offer: number;
  counterOffer: number;
  paymentGiven: boolean;
  paymentReceived: boolean;
  paymentStatus: "PENDING" | "SENT" | "RECEIVED";
  transactionMode: "Direct Deal" | "Use FairTrade";
  status: "NEGOTIATING" | "COUNTER_OFFER" | "AGREED" | "PAYMENT_PENDING" | "PAYMENT_SENT" | "COMPLETED" | "REJECTED" | "CANCELLED";
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DealOffer = {
  id: string;
  dealId: string;
  senderId: string;
  senderRole: "Buyer" | "Farmer";
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  message: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
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
  senderId?: string;
  sender: string;
  text: string;
  time: string;
  createdAt?: string;
};
