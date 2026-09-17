import { ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Section, StatCard } from "../components/Cards";
import { ForecastChart } from "../components/ForecastChart";
import { marketQuotes, scoreComponents } from "../data/mockData";
import { money } from "../utils/format";

export function Reliability() {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Reliability</h1>
      <p className="mt-1 text-sm text-ink/60">Explainable scores based on transaction behavior, lab-quality consistency, fulfilment and payment discipline.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <StatCard label="Farmer Reliability Score" value="92/100" helper="Ramesh Meena profile" icon={ShieldCheck} />
        <StatCard label="Buyer Reliability Score" value="96/100" helper="Shakti Foods Pvt Ltd profile" icon={Users} />
      </div>
      <Section title="Score Components">
        <div className="h-80 rounded-md bg-white p-4 shadow-soft">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreComponents}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e2d6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="farmer" fill="#2f7d4d" radius={4} />
              <Bar dataKey="buyer" fill="#2e7da7" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  );
}

export function PricePulse() {
  const wheat = marketQuotes.filter((item) => item.crop === "Wheat" && item.grade === "FAQ").slice(0, 7);
  const trend = wheat.map((item) => ({ name: item.city, price: item.currentPrice, high: item.high }));
  const quote = marketQuotes[0];
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">FairTrade Price Pulse</h1>
      <p className="mt-1 text-sm text-ink/60">Validated transaction prices feed back into price intelligence and help improve future mandi forecasts.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <StatCard label="Validated transaction prices" value={money(2705)} icon={Sparkles} />
        <StatCard label="Regional mandi trend" value="+1.8%" helper="Kota wheat, 7 days" icon={TrendingUp} />
        <StatCard label="Grade premium" value="+Rs 240/Qt" helper="Lab Verified over FAQ" icon={ShieldCheck} />
      </div>

      <Section title="Validated Price Feedback">
        <div className="grid gap-3 lg:grid-cols-3">
          {["Completed bills", "Lab verified lots", "Buyer-seller agreed rates"].map((item) => (
            <div key={item} className="rounded-md border border-field/10 bg-white p-4 shadow-soft">
              <p className="font-black">{item}</p>
              <p className="mt-2 text-sm leading-6 text-ink/62">Used as supplementary FairTrade signals for trend and prediction displays.</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Regional / Mandi Trends">
        <div className="h-80 rounded-md bg-white p-4 shadow-soft">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e2d6" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#2f7d4d" strokeWidth={3} />
              <Line type="monotone" dataKey="high" stroke="#2e7da7" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>
      <Section title="Grade-wise Price Forecast" subtitle="7-day indicative forecast; actual prices may vary.">
        <div className="rounded-md bg-white p-4 shadow-soft"><ForecastChart data={quote.forecast} /></div>
      </Section>
    </div>
  );
}
