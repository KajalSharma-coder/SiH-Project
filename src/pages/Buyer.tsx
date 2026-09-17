import { BarChart3, CheckCircle2, HandCoins, PackageSearch, Plus, ShoppingBasket } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ForecastChart } from "../components/ForecastChart";
import { Section, StatCard } from "../components/Cards";
import { marketQuotes } from "../data/mockData";
import { getDemands, saveDemand, scoreMatches } from "../services/storage";
import type { Crop, Demand, Grade } from "../types";
import { money } from "../utils/format";

export function BuyerDashboard() {
  const quote = marketQuotes.find((item) => item.city === "Delhi" && item.crop === "Rice") ?? marketQuotes[0];
  const demands = getDemands();
  const matches = scoreMatches(demands[0]);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Buyer Dashboard</h1><p className="text-sm text-ink/60">Track requirements, matching lots, offers, and completed deals.</p></div>
        <Link to="/buyer/demand" className="inline-flex items-center gap-2 rounded-md bg-field px-4 py-3 text-sm font-bold text-white"><Plus size={16} /> Add Demand</Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Live market price" value={`${money(quote.currentPrice)}/Qt`} icon={BarChart3} />
        <StatCard label="Active requirements" value={String(demands.length)} icon={ShoppingBasket} />
        <StatCard label="Matching lots" value={String(matches.length)} icon={PackageSearch} />
        <StatCard label="Offers" value="7" icon={HandCoins} />
        <StatCard label="Completed deals" value="18" icon={CheckCircle2} />
      </div>
      <Section title="7-day forecast" subtitle="7-Day Indicative Forecast — actual prices may vary."><div className="rounded-md bg-white p-4 shadow-soft"><ForecastChart data={quote.forecast} /></div></Section>
      <Matches demand={demands[0]} />
    </div>
  );
}

export function BuyerDemand() {
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const demand: Demand = {
      id: `DEM-${Math.floor(900 + Math.random() * 800)}`,
      buyerId: "B-DEMO",
      buyerName: "Demo Buyer",
      crop: form.get("crop") as Crop,
      grade: form.get("grade") as Grade,
      quantityQt: Number(form.get("quantityQt")),
      minPrice: Number(form.get("minPrice")),
      maxPrice: Number(form.get("maxPrice")),
      city: String(form.get("city")),
      mandi: String(form.get("mandi")),
    };
    saveDemand(demand);
    setSaved(true);
  }
  const demands = getDemands();
  const active = demands[0];
  const input = "rounded-md border border-field/15 bg-white px-3 py-3 outline-none focus:border-field";
  return (
    <div>
      <div className="rounded-md bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-bold">Create Buyer Demand</h1>
        {saved && <p className="mt-3 rounded-md bg-leaf/10 p-3 text-sm font-semibold text-field">Demand saved locally. Matching sellers refreshed below.</p>}
        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
          <select name="crop" className={input}><option>Wheat</option><option>Rice</option><option>Mustard</option><option>Maize</option><option>Gram</option></select>
          <select name="grade" className={input}><option>FAQ</option><option>A</option><option>Premium</option><option>Lab Verified</option><option>Organic</option></select>
          <input name="quantityQt" required type="number" min="1" placeholder="Quantity in quintals" className={input} />
          <div className="grid grid-cols-2 gap-3"><input name="minPrice" required type="number" min="1" placeholder="Min ₹/Qt" className={input} /><input name="maxPrice" required type="number" min="1" placeholder="Max ₹/Qt" className={input} /></div>
          <input name="city" required placeholder="City" defaultValue="Kota" className={input} />
          <input name="mandi" required placeholder="Mandi" defaultValue="Ramganj Mandi" className={input} />
          <button className="rounded-md bg-field px-5 py-3 font-bold text-white md:w-max">Find Seller Matches</button>
        </form>
      </div>
      <Matches demand={active} />
    </div>
  );
}

export function BuyerMatches() {
  return <Matches demand={getDemands()[0]} />;
}

function Matches({ demand }: { demand: Demand }) {
  const matches = useMemo(() => scoreMatches(demand), [demand]);
  return (
    <Section title="Seller matching" subtitle="Weighted by Price Fit + Quality Fit + Quantity Fit + Reliability.">
      <div className="grid gap-3 lg:grid-cols-2">
        {matches.map((match) => (
          <div key={match.lot.id} className="rounded-md border border-field/10 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-bold">{match.lot.farmerName} · {match.lot.id}</p><p className="text-sm text-ink/60">{match.lot.crop} {match.lot.grade} · {match.lot.quantityQt} Qt</p></div>
              <span className="rounded-md bg-field px-3 py-2 text-sm font-bold text-white">{match.total}% match</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <p>Price Fit <b>{match.priceFit}%</b></p><p>Quality Fit <b>{match.qualityFit}%</b></p><p>Quantity Fit <b>{match.quantityFit}%</b></p><p>Reliability <b>{match.reliability}/100</b></p>
            </div>
            <button className="mt-4 rounded-md border border-field/20 px-4 py-2 text-sm font-bold text-field">Send Offer</button>
          </div>
        ))}
      </div>
    </Section>
  );
}
