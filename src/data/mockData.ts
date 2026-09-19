import type { Activity, Deal, Demand, ForecastPoint, Grade, Lot, MarketQuote } from "../types";

const crops = ["Wheat", "Rice", "Mustard", "Maize", "Gram"] as const;
const grades: Grade[] = ["FAQ", "A", "Premium", "Lab Verified", "Organic"];
const jaipurMandis = [
  "Chandpole Mandi",
  "Sanganer Mandi",
  "Chomu (Grain)",
  "Jaipur (Grain)",
  "Jaipur(Grain)(Chandpole)",
  "Kishan Renwal(Fulera)",
  "Kishangarh Renwal",
  "Kotputli",
  "Sambhar (Kishangarh renwal)",
  "Bagru",
  "Chaksu",
  "Bassi",
  "Kotputli(Pawla)",
  "Chomu (F&V)",
  "Jaipur(Grain)(Sodala)",
  "Dudu APMC",
  "Bassi APMC",
  "Chomu Grain APMC",
  "Chaksu APMC",
  "Kishangarh Renwal APMC",
  "Bagru APMC",
  "Rajdhanai Mandi (KukarKheda)",
  "Rajdhanai Mandi (KukarKheda) APMC",
  "Rajdhanai Mandi KukarKheda APMC",
  "Jaipur (Grain) APMC",
];
const locations = [
  { state: "Rajasthan", city: "Kota", mandis: ["Ramganj Mandi", "Kota Krishi Upaj Mandi"] },
  { state: "Rajasthan", city: "Jaipur", mandis: jaipurMandis },
  { state: "Rajasthan", city: "Bundi", mandis: ["Bundi Mandi", "Keshoraipatan Mandi"] },
  { state: "Rajasthan", city: "Alwar", mandis: ["Alwar Mandi", "Khairthal Mandi"] },
  { state: "Rajasthan", city: "Ajmer", mandis: ["Ajmer Mandi", "Kishangarh Mandi"] },
  { state: "Rajasthan", city: "Jodhpur", mandis: ["Mandor Mandi", "Jodhpur Grain Mandi"] },
  { state: "Delhi", city: "Delhi", mandis: ["Narela Mandi", "Najafgarh Mandi"] },
];

const baseByCrop = {
  Wheat: 2575,
  Rice: 3120,
  Mustard: 5870,
  Maize: 2240,
  Gram: 5520,
};

const gradePremium: Record<Grade, number> = {
  FAQ: 0,
  A: 85,
  Premium: 180,
  "Lab Verified": 240,
  Organic: 360,
};

const cityLift: Record<string, number> = {
  Kota: 70,
  Jaipur: 115,
  Bundi: 35,
  Alwar: 95,
  Ajmer: 55,
  Jodhpur: 130,
  Delhi: 175,
};

function forecast(base: number, seed: number): ForecastPoint[] {
  return [
    { label: "Today", actual: base, low: base - 38, high: base + 44, confidence: 96 },
    ...Array.from({ length: 7 }, (_, index) => {
      const wave = Math.round(Math.sin((seed + index) * 0.8) * 34 + index * 13 - 16);
      const predicted = base + wave;
      return {
        label: `Day ${index + 1}`,
        predicted,
        low: predicted - 48 - index * 3,
        high: predicted + 52 + index * 4,
        confidence: 91 - index * 3,
      };
    }),
  ];
}

export const marketQuotes: MarketQuote[] = locations.flatMap((location, locationIndex) =>
  location.mandis.flatMap((mandi, mandiIndex) =>
    crops.flatMap((crop, cropIndex) =>
      grades.map((grade, gradeIndex) => {
        const spread = locationIndex * 18 + mandiIndex * 24 + cropIndex * 31 + gradeIndex * 9;
        const currentPrice = baseByCrop[crop] + cityLift[location.city] + gradePremium[grade] + spread;
        const change = Math.round(Math.sin(spread) * 46);
        return {
          id: `${location.city}-${mandi}-${crop}-${grade}`.replaceAll(" ", "-"),
          state: location.state,
          city: location.city,
          mandi,
          crop,
          grade,
          currentPrice,
          change,
          high: currentPrice + 86,
          low: currentPrice - 74,
          updatedAt: "17 Sep 2026, 11:10 AM",
          confidence: 88 + ((cropIndex + gradeIndex) % 7),
          forecast: forecast(currentPrice, spread),
        };
      }),
    ),
  ),
);

export const lots: Lot[] = [
  { id: "LOT-1042", farmerId: "F-12", farmerName: "Ramesh Meena", crop: "Wheat", grade: "FAQ", declaredQuality: "11.8% moisture, bold grain", labStatus: "Verified", quantityQt: 180, expectedPrice: 2680, city: "Kota", mandi: "Ramganj Mandi", reliability: 92, status: "Active" },
  { id: "LOT-1043", farmerId: "F-17", farmerName: "Sushila Gurjar", crop: "Mustard", grade: "Premium", declaredQuality: "Clean seed, low admixture", labStatus: "Submitted", quantityQt: 95, expectedPrice: 6160, city: "Jaipur", mandi: "Sanganer Mandi", reliability: 88, status: "Matched" },
  { id: "LOT-1044", farmerId: "F-21", farmerName: "Iqbal Khan", crop: "Gram", grade: "Lab Verified", declaredQuality: "Large grain, 1.2% foreign matter", labStatus: "Verified", quantityQt: 120, expectedPrice: 5900, city: "Ajmer", mandi: "Ajmer Mandi", reliability: 95, status: "In Deal" },
  { id: "LOT-1045", farmerId: "F-33", farmerName: "Neelam Yadav", crop: "Rice", grade: "A", declaredQuality: "Fine grain, polished sample", labStatus: "Pending", quantityQt: 210, expectedPrice: 3360, city: "Delhi", mandi: "Narela Mandi", reliability: 84, status: "Active" },
  { id: "LOT-1046", farmerId: "F-41", farmerName: "Mahendra Singh", crop: "Maize", grade: "Organic", declaredQuality: "Chemical-free cultivation record", labStatus: "Submitted", quantityQt: 75, expectedPrice: 2820, city: "Bundi", mandi: "Bundi Mandi", reliability: 90, status: "Active" },
];

export const demands: Demand[] = [
  { id: "DEM-781", buyerId: "B-8", buyerName: "Shakti Foods Pvt Ltd", crop: "Wheat", grade: "FAQ", quantityQt: 150, minPrice: 2550, maxPrice: 2750, city: "Kota", mandi: "Ramganj Mandi" },
  { id: "DEM-782", buyerId: "B-9", buyerName: "Delhi Agro Mart", crop: "Rice", grade: "A", quantityQt: 200, minPrice: 3200, maxPrice: 3480, city: "Delhi", mandi: "Narela Mandi" },
  { id: "DEM-783", buyerId: "B-14", buyerName: "Marwar Oil Mills", crop: "Mustard", grade: "Premium", quantityQt: 80, minPrice: 5900, maxPrice: 6250, city: "Jaipur", mandi: "Sanganer Mandi" },
];

export const deals: Deal[] = [
  { id: "DL-9001", farmer: "Iqbal Khan", buyer: "Kisan Retail Chain", farmerId: "F-21", buyerId: "B-14", lotId: "LOT-1044", marketName: "Ajmer Mandi", marketCity: "Ajmer", crop: "Gram", quantityQt: 120, grade: "Lab Verified", agreedPrice: 5860, offer: 5800, counterOffer: 5920, paymentGiven: true, paymentReceived: false, paymentStatus: "SENT", transactionMode: "Use FairTrade", status: "PAYMENT_SENT", date: "17 Sep 2026" },
  { id: "DL-9002", farmer: "Ramesh Meena", buyer: "Shakti Foods Pvt Ltd", farmerId: "F-12", buyerId: "B-8", lotId: "LOT-1042", marketName: "Ramganj Mandi", marketCity: "Kota", crop: "Wheat", quantityQt: 150, grade: "FAQ", agreedPrice: 2705, offer: 2660, counterOffer: 2725, paymentGiven: true, paymentReceived: true, paymentStatus: "RECEIVED", transactionMode: "Use FairTrade", status: "COMPLETED", date: "16 Sep 2026" },
];

export const activities: Activity[] = [
  { id: "A1", title: "Lab result uploaded", detail: "LOT-1044 received FairTrade Lab Verified grade.", time: "18 min ago" },
  { id: "A2", title: "Buyer counter offer", detail: "Shakti Foods raised wheat offer to Rs 2,705/Qt.", time: "1 hr ago" },
  { id: "A3", title: "Price pulse updated", detail: "Kota wheat trend moved +1.8% over 7 days.", time: "Today" },
];

export const scoreComponents = [
  { name: "On-time delivery", farmer: 94, buyer: 89 },
  { name: "Quality consistency", farmer: 91, buyer: 86 },
  { name: "Payment discipline", farmer: 87, buyer: 96 },
  { name: "Dispute history", farmer: 96, buyer: 92 },
];
