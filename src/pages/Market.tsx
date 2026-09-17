import { ArrowDownRight, ArrowUpRight, BarChart3, Clock, Gauge, ShieldCheck, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ForecastChart } from "../components/ForecastChart";
import { MarketSelector } from "../components/MarketSelector";
import { Section, StatCard } from "../components/Cards";
import { marketQuotes } from "../data/mockData";
import { money } from "../utils/format";

export function Market() {
  const [quote, setQuote] = useState(marketQuotes.find((item) => item.city === "Kota" && item.crop === "Wheat" && item.grade === "FAQ") ?? marketQuotes[0]);
  const cropQuotes = useMemo(() => marketQuotes.filter((item) => item.crop === quote.crop), [quote.crop]);
  const regional = useMemo(() => cropQuotes.filter((item) => item.grade === quote.grade).slice(0, 9), [cropQuotes, quote.grade]);
  const gradeSpread = useMemo(
    () => marketQuotes.filter((item) => item.city === quote.city && item.mandi === quote.mandi && item.crop === quote.crop),
    [quote.city, quote.crop, quote.mandi],
  );
  const ChangeIcon = quote.change >= 0 ? ArrowUpRight : ArrowDownRight;
  const predicted = quote.forecast.filter((item) => item.predicted);
  const expected = predicted[predicted.length - 1]?.predicted ?? quote.currentPrice;

  return (
    <div>
      <section className="rounded-md border border-field/10 bg-white p-5 shadow-soft lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-md bg-leaf/10 px-3 py-2 text-sm font-bold text-field">
              <BarChart3 size={16} /> Live Stock / Price Prediction
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-ink sm:text-4xl">Mandi prices that farmers can understand quickly.</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">
              Filter by region, mandi, crop and quality grade. The forecast is indicative and connected to FairTrade Price Pulse signals from validated transactions.
            </p>
          </div>
          <div className="rounded-md bg-cream px-4 py-3 text-sm">
            <p className="font-bold text-field">Prediction summary</p>
            <p className="text-ink/65">7-day expected: <b className="text-ink">{money(expected)}/Qt</b></p>
          </div>
        </div>

        <div className="mt-5">
          <MarketSelector quote={quote} onChange={setQuote} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Current price" value={`${money(quote.currentPrice)}/Qt`} helper={`${quote.crop} - ${quote.grade}`} icon={TrendingUp} />
          <StatCard label="Today's change" value={`${quote.change >= 0 ? "+" : ""}${quote.change}/Qt`} helper="Compared with last close" icon={ChangeIcon} />
          <StatCard label="Confidence" value={`${quote.confidence}%`} helper="Mandi + transaction signal" icon={Gauge} />
          <StatCard label="Updated" value={quote.updatedAt.split(", ")[1]} helper={quote.updatedAt} icon={Clock} />
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black">7-day price trend and prediction</h2>
              <p className="text-sm text-ink/60">Green line shows predicted price band, blue marks current actual price.</p>
            </div>
            <span className="rounded-md bg-leaf/10 px-3 py-2 text-xs font-bold text-field">Indicative forecast</span>
          </div>
          <ForecastChart data={quote.forecast} height={320} />
        </section>

        <section className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black">Grade-wise price view</h2>
          <p className="text-sm text-ink/60">{quote.city} - {quote.mandi}</p>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeSpread} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e2d6" />
                <XAxis dataKey="grade" tick={{ fontSize: 12, fill: "#587166" }} />
                <YAxis tickFormatter={(value) => `Rs ${value}`} tick={{ fontSize: 12, fill: "#587166" }} width={70} />
                <Tooltip formatter={(value: number) => [money(value), "Price"]} contentStyle={{ borderRadius: 8, border: "1px solid #d9e2d6" }} />
                <Bar dataKey="currentPrice" fill="#2f7d4d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <Section title="Region / Category Prices" subtitle={`Current ${quote.crop} ${quote.grade} rates across active FairTrade markets.`}>
        <div className="overflow-x-auto rounded-md border border-field/10 bg-white shadow-soft">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-cream text-ink/65">
              <tr>
                <th className="p-3">Region</th>
                <th className="p-3">Mandi</th>
                <th className="p-3">Category</th>
                <th className="p-3">Current price</th>
                <th className="p-3">Day change</th>
                <th className="p-3">Signal</th>
              </tr>
            </thead>
            <tbody>
              {regional.map((item) => (
                <tr key={item.id} className="border-t border-field/10">
                  <td className="p-3 font-semibold">{item.city}, {item.state}</td>
                  <td className="p-3 text-ink/70">{item.mandi}</td>
                  <td className="p-3">{item.grade}</td>
                  <td className="p-3 font-black text-field">{money(item.currentPrice)}/Qt</td>
                  <td className={`p-3 font-semibold ${item.change >= 0 ? "text-field" : "text-red-600"}`}>{item.change >= 0 ? "+" : ""}{item.change}</td>
                  <td className="p-3">{item.confidence}% confidence</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="FairTrade Price Pulse Connection">
        <div className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-black">Validated deal prices feed back into price intelligence.</p>
              <p className="mt-1 text-sm text-ink/62">Completed bills and lab-verified lots improve the regional reference signal used by farmers and buyers.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md bg-leaf/10 px-4 py-3 text-sm font-bold text-field">
              <ShieldCheck size={16} /> Transaction-validated signal
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
