import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ForecastChart } from "../components/ForecastChart";
import { MarketSelector } from "../components/MarketSelector";
import { StatCard } from "../components/Cards";
import { getMarketQuotes } from "../services/api";
import type { MarketQuote } from "../types";
import { money } from "../utils/format";
import { Loading, PageHeader } from "./Market";

export function PricePrediction() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [period, setPeriod] = useState("7 Days");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketQuotes()
      .then((data) => {
        setQuotes(data);
        setQuote(data[0] ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !quote) {
    return <Loading text="Loading price prediction..." />;
  }

  const forecast = quote.forecast.filter((point) => point.predicted);
  const predicted = forecast[forecast.length - 1]?.predicted ?? quote.currentPrice;
  const change = predicted - quote.currentPrice;
  const changePercent = quote.currentPrice ? (change / quote.currentPrice) * 100 : 0;
  const ChangeIcon = change >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="space-y-5">
      <PageHeader title="Price Prediction" subtitle="Choose crop, mandi and time period to view recent market estimates." />

      <section className="rounded-md border border-[#D8CDBB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
          <MarketSelector quote={quote} quotes={quotes} onChange={setQuote} />
          <label className="text-xs font-bold uppercase tracking-wide text-[#765536]">
            Time Period
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-1 w-full rounded-md border border-[#D8CDBB] bg-white px-3 py-3 text-sm normal-case outline-none focus:border-[#B96832]">
              <option>7 Days</option>
              <option>14 Days</option>
              <option>30 Days</option>
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Current Price" value={`${money(quote.currentPrice)}/qt`} helper={`${quote.crop} at ${quote.mandi}`} icon={TrendingUp} />
        <StatCard label="Predicted Price" value={`${money(predicted)}/qt`} helper={period} icon={BarChart3} />
        <StatCard label="Expected Change" value={`${change >= 0 ? "+" : ""}${money(change)} (${changePercent.toFixed(1)}%)`} helper="Estimate only" icon={ChangeIcon} />
      </div>

      <section className="rounded-md border border-[#D8CDBB] bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-black">Simple Price Trend</h2>
          <span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#33291F]">{quote.confidence}% confidence</span>
        </div>
        <ForecastChart data={quote.forecast} height={320} />
        <p className="mt-4 rounded-md bg-[#F4EFE4] p-3 text-sm text-[#765536]">
          Prediction is an estimate based on recent market trends.
        </p>
      </section>
    </div>
  );
}

export function DailyPriceTracking() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketQuotes()
      .then(setQuotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(
    () =>
      quotes.slice(0, 12).map((quote, index) => ({
        ...quote,
        date: new Date(Date.now() - index * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      })),
    [quotes],
  );

  if (loading) {
    return <Loading text="Loading daily price tracking..." />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Daily Price Tracking" subtitle="Daily crop, mandi, price and change from market quote data." />

      <div className="overflow-x-auto rounded-md border border-[#D8CDBB] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F4EFE4] text-[#765536]">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Crop</th>
              <th className="p-4">Mandi</th>
              <th className="p-4">Price</th>
              <th className="p-4">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8CDBB]">
            {rows.map((row) => {
              const positive = row.change >= 0;
              const Icon = positive ? ArrowUpRight : ArrowDownRight;
              return (
                <tr key={row.id}>
                  <td className="p-4 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={15} className="text-[#B96832]" />
                      {row.date}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{row.crop}</td>
                  <td className="p-4 text-[#765536]">{row.mandi}, {row.city}</td>
                  <td className="p-4 font-black text-[#33291F]">{money(row.currentPrice)}/qt</td>
                  <td className={`p-4 font-bold ${positive ? "text-[#555633]" : "text-[#B96832]"}`}>
                    <span className="inline-flex items-center gap-1">
                      <Icon size={16} />
                      {positive ? "+" : ""}{row.change}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Reliability() {
  return <PricePrediction />;
}

export function PricePulse() {
  return <PricePrediction />;
}
