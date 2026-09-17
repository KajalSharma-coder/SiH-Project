import { ArrowDownRight, ArrowUpRight, BarChart3, Clock, Gauge, TrendingUp, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ForecastChart } from "../components/ForecastChart";
import { MarketSelector } from "../components/MarketSelector";
import { Section, StatCard } from "../components/Cards";
import { getMarketQuotes } from "../services/api";
import type { MarketQuote } from "../types";
import { money } from "../utils/format";

export function Market() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuotes() {
      try {
        const data = await getMarketQuotes();
        setQuotes(data);
        if (data.length > 0) {
          const defaultQuote = data.find((item) => item.city === "Kota" && item.crop === "Wheat" && item.grade === "FAQ") || data[0];
          setQuote(defaultQuote);
        }
      } catch (err) {
        console.error("Error fetching market quotes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuotes();
  }, []);

  const cropQuotes = useMemo(() => (quote ? quotes.filter((item) => item.crop === quote.crop) : []), [quotes, quote]);
  const regional = useMemo(() => (quote ? cropQuotes.filter((item) => item.grade === quote.grade).slice(0, 9) : []), [cropQuotes, quote]);
  const gradeSpread = useMemo(
    () => (quote ? quotes.filter((item) => item.city === quote.city && item.mandi === quote.mandi && item.crop === quote.crop) : []),
    [quotes, quote]
  );

  if (loading || !quote) {
    return (
      <div className="grid min-h-[400px] place-items-center rounded-2xl bg-white p-8 shadow-soft">
        <div className="flex items-center gap-3 text-[#2f7d4d] font-semibold">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#2f7d4d] border-t-transparent" />
          Loading real-time mandi prices & predictions...
        </div>
      </div>
    );
  }

  const ChangeIcon = quote.change >= 0 ? ArrowUpRight : ArrowDownRight;
  const predicted = quote.forecast.filter((item) => item.predicted);
  const expected = predicted[predicted.length - 1]?.predicted ?? quote.currentPrice;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#2f7d4d]/10 px-3.5 py-1.5 text-xs font-bold text-[#2f7d4d]">
              <BarChart3 size={16} /> Live Stock & Price Prediction
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#17312a] sm:text-4xl">
              Mandi prices backed by database intelligence.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#17312a]/70">
              Filter by region, mandi, crop and category/grade. All predictions are generated using historical mandi arrivals, grade premiums, and transaction feedback.
            </p>
          </div>
          <div className="rounded-xl bg-[#f6f1e7] border border-[#2f7d4d]/10 px-5 py-3.5 text-sm">
            <p className="font-bold text-[#2f7d4d]">7-Day Expected Forecast</p>
            <p className="text-[#17312a]/70 mt-0.5">Indicative price: <b className="text-[#17312a] text-base">{money(expected)}/Qt</b></p>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <span><b>Forecast Disclaimer:</b> Price predictions are algorithmically generated estimates intended to guide negotiations. Actual mandi settlement prices may vary based on spot demand and moisture quality.</span>
        </div>

        {/* Selector */}
        <div className="mt-6">
          <MarketSelector quote={quote} quotes={quotes} onChange={setQuote} />
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Current Price" value={`${money(quote.currentPrice)}/Qt`} helper={`${quote.crop} - ${quote.grade}`} icon={TrendingUp} />
          <StatCard label="Day's Change" value={`${quote.change >= 0 ? "+" : ""}${quote.change}/Qt`} helper="Compared with last close" icon={ChangeIcon} />
          <StatCard label="Confidence Score" value={`${quote.confidence}%`} helper="Mandi + transaction signal" icon={Gauge} />
          <StatCard label="Last Updated" value={quote.updatedAt} helper="Database reference" icon={Clock} />
        </div>
      </section>

      {/* Forecast Chart & Grade Spread */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-6 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-[#17312a]">7-Day Price Trend & Forecast</h2>
              <p className="text-xs text-[#17312a]/60">Green line represents predicted trend band, blue marks actual current reference.</p>
            </div>
            <span className="rounded-full bg-[#2f7d4d]/10 px-3 py-1 text-xs font-bold text-[#2f7d4d]">
              Indicative Forecast
            </span>
          </div>
          <ForecastChart data={quote.forecast} height={300} />
        </section>

        <section className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-[#17312a]">Grade-Wise Price Comparison</h2>
          <p className="text-xs text-[#17312a]/60">{quote.city} - {quote.mandi} ({quote.crop})</p>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeSpread} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2d6" />
                <XAxis dataKey="grade" tick={{ fontSize: 12, fill: "#17312a" }} />
                <YAxis tickFormatter={(value) => `Rs ${value}`} tick={{ fontSize: 12, fill: "#17312a" }} width={70} />
                <Tooltip formatter={(value: number) => [money(value), "Price"]} contentStyle={{ borderRadius: 12, border: "1px solid #d9e2d6" }} />
                <Bar dataKey="currentPrice" fill="#2f7d4d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Regional Mandi Table */}
      <Section title="Regional Mandi Category Prices" subtitle={`Current ${quote.crop} (${quote.grade}) prices across active markets.`}>
        <div className="overflow-x-auto rounded-2xl border border-[#2f7d4d]/15 bg-white shadow-soft">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f6f1e7] text-[#17312a]/70 font-bold">
              <tr>
                <th className="p-4">Region</th>
                <th className="p-4">Mandi</th>
                <th className="p-4">Category</th>
                <th className="p-4">Current Price</th>
                <th className="p-4">Day Change</th>
                <th className="p-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2f7d4d]/10">
              {regional.map((item) => (
                <tr key={item.id} className="hover:bg-[#f6f1e7]/40 transition">
                  <td className="p-4 font-bold text-[#17312a]">{item.city}, {item.state}</td>
                  <td className="p-4 text-[#17312a]/70">{item.mandi}</td>
                  <td className="p-4"><span className="rounded-lg bg-[#2f7d4d]/10 px-2.5 py-1 text-xs font-bold text-[#2f7d4d]">{item.grade}</span></td>
                  <td className="p-4 font-black text-[#2f7d4d] text-base">{money(item.currentPrice)}/Qt</td>
                  <td className={`p-4 font-extrabold ${item.change >= 0 ? "text-[#2f7d4d]" : "text-red-600"}`}>
                    {item.change >= 0 ? "+" : ""}{item.change}
                  </td>
                  <td className="p-4 text-[#17312a]/70 font-medium">{item.confidence}% confidence</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
