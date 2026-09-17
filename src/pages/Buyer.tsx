import { BarChart3, HandCoins, PackageSearch, Plus, ShieldCheck, ShoppingBasket } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ForecastChart } from "../components/ForecastChart";
import { Section, StatCard } from "../components/Cards";
import { marketQuotes } from "../data/mockData";
import { getDeals, getDemands, getSession, saveDemand, scoreMatches } from "../services/storage";
import type { Crop, Demand, Grade } from "../types";
import { money } from "../utils/format";

export function BuyerDashboard() {
  const quote = marketQuotes.find((item) => item.city === "Delhi" && item.crop === "Rice") ?? marketQuotes[0];
  const demands = getDemands();
  const deals = getDeals();
  const session = getSession();
  const matches = scoreMatches(demands[0]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Buyer Dashboard</h1>
          <p className="text-sm text-ink/60">Profile, requirements, matching farmer lots, offers, active deals and transaction history.</p>
          {session?.role === "Buyer" && <p className="mt-1 text-xs font-bold text-field">Signed in as {session.name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/login" className="rounded-md border border-field/20 bg-white px-4 py-3 text-sm font-bold text-field">Login / Signup</Link>
          <Link to="/buyer/demand" className="inline-flex items-center gap-2 rounded-md bg-field px-4 py-3 text-sm font-bold text-white"><Plus size={16} /> Add Requirement</Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Live market price" value={`${money(quote.currentPrice)}/Qt`} icon={BarChart3} />
        <StatCard label="Active requirements" value={String(demands.length)} icon={ShoppingBasket} />
        <StatCard label="Matching lots" value={String(matches.length)} icon={PackageSearch} />
        <StatCard label="Offers sent" value="7" icon={HandCoins} />
        <StatCard label="Reliability" value="96/100" helper="Payment discipline strong" icon={ShieldCheck} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black">Buyer profile</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="rounded-md bg-cream p-3">Company <b className="block text-ink">Shakti Foods Pvt Ltd</b></p>
            <p className="rounded-md bg-cream p-3">Procurement focus <b className="block text-ink">Wheat, Rice, Mustard</b></p>
            <p className="rounded-md bg-cream p-3">Payment status <b className="block text-field">Verified buyer</b></p>
          </div>
        </section>
        <section className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Price intelligence</h2>
              <p className="text-sm text-ink/60">Use forecast while setting requirement ranges.</p>
            </div>
            <Link to="/market" className="text-sm font-bold text-field">Open market</Link>
          </div>
          <ForecastChart data={quote.forecast} height={240} />
        </section>
      </div>

      <Section title="Active Requirements">
        <div className="grid gap-3 lg:grid-cols-3">
          {demands.map((demand) => (
            <div key={demand.id} className="rounded-md border border-field/10 bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{demand.crop} - {demand.grade}</p>
                  <p className="text-sm text-ink/60">{demand.city} - {demand.mandi}</p>
                </div>
                <span className="rounded-md bg-leaf/10 px-2 py-1 text-xs font-bold text-field">{demand.id}</span>
              </div>
              <p className="mt-3 text-sm text-ink/65">Need <b>{demand.quantityQt} Qt</b> at <b>{money(demand.minPrice)}-{money(demand.maxPrice)}/Qt</b></p>
            </div>
          ))}
        </div>
      </Section>

      <Matches demand={demands[0]} />

      <Section title="Active Deals and History">
        <div className="grid gap-3 lg:grid-cols-2">
          {deals.map((deal) => (
            <Link key={deal.id} to={`/deal-room/${deal.id}`} className="rounded-md border border-field/10 bg-white p-4 shadow-soft transition hover:border-field">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{deal.id} - {deal.crop}</p>
                  <p className="text-sm text-ink/60">{deal.farmer} - {deal.quantityQt} Qt - {deal.grade}</p>
                </div>
                <span className="rounded-md bg-cream px-3 py-2 text-xs font-bold text-ink/70">{deal.status}</span>
              </div>
              <p className="mt-3 text-sm text-ink/65">Total value <b>{money(deal.agreedPrice * deal.quantityQt)}</b></p>
            </Link>
          ))}
        </div>
      </Section>
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
  const input = "rounded-md border border-field/15 bg-white px-3 py-3 outline-none transition focus:border-field";
  return (
    <div>
      <div className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
        <h1 className="text-3xl font-black tracking-tight">Add Buyer Requirement</h1>
        <p className="mt-1 text-sm text-ink/60">Enter crop, quantity, quality/category and price range to find matching farmers.</p>
        {saved && <p className="mt-3 rounded-md bg-leaf/10 p-3 text-sm font-semibold text-field">Requirement saved locally. Matching sellers refreshed below.</p>}
        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
          <select name="crop" className={input}><option>Wheat</option><option>Rice</option><option>Mustard</option><option>Maize</option><option>Gram</option></select>
          <select name="grade" className={input}><option>FAQ</option><option>A</option><option>Premium</option><option>Lab Verified</option><option>Organic</option></select>
          <input name="quantityQt" required type="number" min="1" placeholder="Quantity in quintals" className={input} />
          <div className="grid grid-cols-2 gap-3"><input name="minPrice" required type="number" min="1" placeholder="Min Rs/Qt" className={input} /><input name="maxPrice" required type="number" min="1" placeholder="Max Rs/Qt" className={input} /></div>
          <input name="city" required placeholder="City" defaultValue="Kota" className={input} />
          <input name="mandi" required placeholder="Mandi" defaultValue="Ramganj Mandi" className={input} />
          <button className="rounded-md bg-field px-5 py-3 font-bold text-white md:w-max">Find Farmer Matches</button>
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
  const [offeredLot, setOfferedLot] = useState<string | null>(null);
  return (
    <Section title="Matching Farmers / Lots" subtitle="Weighted by price fit, quality fit, quantity fit and reliability.">
      {offeredLot && <p className="mb-3 rounded-md bg-leaf/10 p-3 text-sm font-semibold text-field">Offer sent for {offeredLot}. Open the deal room to continue negotiation.</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {matches.map((match) => (
          <div key={match.lot.id} className="rounded-md border border-field/10 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{match.lot.farmerName} - {match.lot.id}</p>
                <p className="text-sm text-ink/60">{match.lot.crop} {match.lot.grade} - {match.lot.quantityQt} Qt</p>
              </div>
              <span className="rounded-md bg-field px-3 py-2 text-sm font-bold text-white">{match.total}% match</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <p>Price Fit <b>{match.priceFit}%</b></p>
              <p>Quality Fit <b>{match.qualityFit}%</b></p>
              <p>Quantity Fit <b>{match.quantityFit}%</b></p>
              <p>Reliability <b>{match.reliability}/100</b></p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setOfferedLot(match.lot.id)} className="rounded-md bg-field px-4 py-2 text-sm font-bold text-white">Send Offer</button>
              <Link to="/deal-room/DL-9002" className="rounded-md border border-field/20 px-4 py-2 text-sm font-bold text-field">Open Deal</Link>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
