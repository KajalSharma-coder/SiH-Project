import { ArrowDownRight, ArrowUpRight, Clock, Gauge, Radio, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { ForecastChart } from "../components/ForecastChart";
import { MarketSelector } from "../components/MarketSelector";
import { Section, StatCard } from "../components/Cards";
import { marketQuotes } from "../data/mockData";
import { money } from "../utils/format";

export function Home() {
  const [quote, setQuote] = useState(marketQuotes.find((item) => item.city === "Kota" && item.mandi === "Ramganj Mandi" && item.crop === "Wheat" && item.grade === "FAQ") ?? marketQuotes[0]);
  const comparisons = useMemo(
    () => marketQuotes.filter((item) => item.crop === quote.crop && item.grade === quote.grade).slice(0, 8),
    [quote.crop, quote.grade],
  );
  const predicted = quote.forecast.filter((item) => item.predicted);
  const min = Math.min(...predicted.map((item) => item.low));
  const max = Math.max(...predicted.map((item) => item.high));
  const ChangeIcon = quote.change >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div>
      <section className="overflow-hidden rounded-md border border-field/10 bg-white shadow-soft">
        <div className="grid gap-8 p-5 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-leaf/10 px-3 py-2 text-sm font-semibold text-field">
              <Radio size={16} /> Live market signal
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Live Mandi Price & 7-Day Forecast
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68">
              Compare validated mandi trends, indicative price ranges, and buyer-ready quality grades in one clean FairTrade workspace.
            </p>
            <div className="mt-6">
              <MarketSelector quote={quote} onChange={setQuote} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Current price" value={`${money(quote.currentPrice)}/Qt`} helper={`${quote.crop} · ${quote.grade}`} icon={TrendingUp} />
              <StatCard label="Today's change" value={`${quote.change >= 0 ? "+" : ""}${quote.change}`} helper="Compared with last close" icon={ChangeIcon} />
              <StatCard label="High / Low" value={`${money(quote.high)} / ${money(quote.low)}`} helper="Intraday mandi band" icon={Gauge} />
              <StatCard label="Last updated" value={quote.updatedAt.split(", ")[1]} helper={quote.updatedAt} icon={Clock} />
            </div>
          </div>
          <div className="rounded-md bg-cream p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-field">7-Day Indicative Forecast — actual prices may vary.</p>
                <p className="text-xs text-ink/55">Expected range {money(min)} to {money(max)} · Confidence {quote.confidence}%</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-bold text-field">
                <span className="h-2 w-2 rounded-full bg-leaf" /> Updated
              </span>
            </div>
            <ForecastChart data={quote.forecast} />
          </div>
        </div>
      </section>

      <Section title="City-wise / Mandi-wise comparison" subtitle={`Comparing ${quote.crop} ${quote.grade} quotes across active FairTrade markets.`}>
        <div className="overflow-x-auto rounded-md border border-field/10 bg-white shadow-soft">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-cream text-ink/65">
              <tr><th className="p-3">City</th><th className="p-3">Mandi</th><th className="p-3">Price</th><th className="p-3">Change</th><th className="p-3">Confidence</th></tr>
            </thead>
            <tbody>
              {comparisons.map((item) => (
                <tr key={item.id} className="border-t border-field/10">
                  <td className="p-3 font-semibold">{item.city}</td>
                  <td className="p-3">{item.mandi}</td>
                  <td className="p-3">{money(item.currentPrice)}/Qt</td>
                  <td className={`p-3 font-semibold ${item.change >= 0 ? "text-field" : "text-red-600"}`}>{item.change >= 0 ? "+" : ""}{item.change}</td>
                  <td className="p-3">{item.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
