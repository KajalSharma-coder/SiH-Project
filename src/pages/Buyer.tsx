import { BarChart3, HandCoins, PackageSearch, Plus, ShieldCheck, ShoppingBasket } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ForecastChart } from "../components/ForecastChart";
import { Section, StatCard } from "../components/Cards";
import { useAuth } from "../context/AuthContext";
import { createDemand, getDeals, getDemands, getLots, getMarketQuotes, scoreMatches } from "../services/api";
import type { Crop, Deal, Demand, Grade, Lot, MarketQuote } from "../types";
import { money } from "../utils/format";

export function BuyerDashboard() {
  const { user } = useAuth();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBuyerData() {
      try {
        const [demData, lotData, dData, qData] = await Promise.all([
          getDemands(),
          getLots(),
          getDeals(),
          getMarketQuotes(),
        ]);
        setDemands(demData);
        setLots(lotData);
        setDeals(dData);
        setQuotes(qData);
      } catch (err) {
        console.error("Error loading buyer dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBuyerData();
  }, []);

  const quote = quotes.find((item) => item.city === "Delhi" && item.crop === "Rice") || quotes[0];
  const buyerDemands = user ? demands.filter((d) => d.buyerId === user.id || d.buyerName === user.name) : demands;
  const displayDemands = buyerDemands.length > 0 ? buyerDemands : demands;
  const activeDemand = displayDemands[0];
  const matches = useMemo(() => (activeDemand ? scoreMatches(activeDemand, lots) : []), [activeDemand, lots]);

  if (loading) {
    return (
      <div className="grid min-h-[400px] place-items-center rounded-2xl bg-white p-8 shadow-soft">
        <div className="flex items-center gap-3 text-[#2f7d4d] font-semibold">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#2f7d4d] border-t-transparent" />
          Loading Buyer Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#17312a]">Buyer Dashboard</h1>
          <p className="text-sm text-[#17312a]/65 mt-0.5">
            Manage procurement requirements, view matched produce lots, send offers, and finalize deals.
          </p>
          {user && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#2f7d4d]/10 px-3 py-1 text-xs font-bold text-[#2f7d4d]">
              Profile: {user.name} ({user.identifier})
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/buyer/demand"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2f7d4d] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#25663e]"
          >
            <Plus size={18} /> Post Crop Requirement
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Live Mandi Rate" value={quote ? `${money(quote.currentPrice)}/Qt` : "Rs 3,120/Qt"} icon={BarChart3} />
        <StatCard label="My Requirements" value={String(displayDemands.length)} icon={ShoppingBasket} />
        <StatCard label="Matching Farmers" value={String(matches.length)} icon={PackageSearch} />
        <StatCard label="Active Deals" value={String(deals.length)} icon={HandCoins} />
        <StatCard label="Reliability Score" value="96/100" helper="Verified Buyer" icon={ShieldCheck} />
      </div>

      {/* Profile & Intelligence */}
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-[#17312a]">Buyer Profile</h2>
          <div className="mt-4 space-y-3 text-xs">
            <div className="rounded-xl bg-[#f6f1e7] p-3.5 border border-[#2f7d4d]/10">
              <span className="text-[#17312a]/60">Company / Name</span>
              <b className="block text-sm text-[#17312a] mt-0.5">{user?.name || "Shakti Foods Pvt Ltd"}</b>
            </div>
            <div className="rounded-xl bg-[#f6f1e7] p-3.5 border border-[#2f7d4d]/10">
              <span className="text-[#17312a]/60">Procurement Focus</span>
              <b className="block text-sm text-[#17312a] mt-0.5">Wheat, Rice, Mustard, Gram</b>
            </div>
            <div className="rounded-xl bg-[#f6f1e7] p-3.5 border border-[#2f7d4d]/10">
              <span className="text-[#17312a]/60">Verification Status</span>
              <b className="block text-sm text-[#2f7d4d] mt-0.5">FairTrade Verified Buyer</b>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#17312a]">Price Intelligence & Forecast</h2>
              <p className="text-xs text-[#17312a]/60">Use price trends when placing requirement bids.</p>
            </div>
            <Link to="/market" className="text-xs font-bold text-[#2f7d4d] hover:underline">
              Open Market
            </Link>
          </div>
          {quote && <ForecastChart data={quote.forecast} height={230} />}
        </section>
      </div>

      {/* Active Requirements List */}
      <Section title="Active Requirements">
        <div className="grid gap-4 lg:grid-cols-3">
          {displayDemands.map((demand) => (
            <div key={demand.id} className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#17312a]">{demand.crop} ({demand.grade})</p>
                  <p className="text-xs text-[#17312a]/65">{demand.city} - {demand.mandi}</p>
                </div>
                <span className="rounded-full bg-[#2f7d4d]/10 px-3 py-1 text-xs font-bold text-[#2f7d4d]">
                  {demand.id}
                </span>
              </div>
              <p className="mt-3 text-xs text-[#17312a]/75">
                Target: <b>{demand.quantityQt} Qt</b> at <b>{money(demand.minPrice)}-{money(demand.maxPrice)}/Qt</b>
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Matches */}
      {activeDemand && <MatchesSection demand={activeDemand} lots={lots} />}

      {/* Deals */}
      <Section title="Active Deals & Transaction Records">
        <div className="grid gap-4 lg:grid-cols-2">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              to={`/deal-room/${deal.id}`}
              className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-5 shadow-soft transition hover:border-[#2f7d4d]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#17312a]">{deal.id} - {deal.crop}</p>
                  <p className="text-xs text-[#17312a]/65">Farmer: {deal.farmer} ({deal.grade})</p>
                </div>
                <span className="rounded-full bg-[#f6f1e7] px-3 py-1 text-xs font-bold text-[#17312a]">
                  {deal.status}
                </span>
              </div>
              <div className="mt-3 flex justify-between items-center text-xs bg-[#f6f1e7] p-3 rounded-xl border border-[#2f7d4d]/10">
                <span>Agreed Total: <b className="text-sm text-[#2f7d4d] font-bold">{money(deal.agreedPrice * deal.quantityQt)}</b></span>
                <span>Mode: <b>{deal.transactionMode}</b></span>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

export function BuyerDemand() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      await createDemand({
        crop: form.get("crop") as Crop,
        grade: form.get("grade") as Grade,
        quantityQt: Number(form.get("quantityQt")),
        minPrice: Number(form.get("minPrice")),
        maxPrice: Number(form.get("maxPrice")),
        city: String(form.get("city")),
        mandi: String(form.get("mandi")),
      });
      navigate("/buyer/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create requirement.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#2f7d4d]/20 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#2f7d4d] focus:ring-2 focus:ring-[#2f7d4d]/15";

  return (
    <div className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-6 shadow-soft max-w-3xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight text-[#17312a]">Post Crop Requirement</h1>
      <p className="mt-1 text-sm text-[#17312a]/65">
        Enter crop, quantity, quality grade and price range to match with produce lots in database.
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">Crop</label>
          <select name="crop" className={inputClass}>
            <option>Wheat</option>
            <option>Rice</option>
            <option>Mustard</option>
            <option>Maize</option>
            <option>Gram</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">Required Category / Grade</label>
          <select name="grade" className={inputClass}>
            <option>FAQ</option>
            <option>A</option>
            <option>Premium</option>
            <option>Lab Verified</option>
            <option>Organic</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">Quantity (Quintals)</label>
          <input name="quantityQt" required type="number" min="1" placeholder="e.g. 150" className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">Target Price Range (Rs/Qt)</label>
          <div className="grid grid-cols-2 gap-2">
            <input name="minPrice" required type="number" min="1" placeholder="Min Rs" className={inputClass} />
            <input name="maxPrice" required type="number" min="1" placeholder="Max Rs" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">City</label>
          <input name="city" required placeholder="City" defaultValue="Kota" className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">Mandi</label>
          <input name="mandi" required placeholder="Mandi" defaultValue="Ramganj Mandi" className={inputClass} />
        </div>

        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
          <Link to="/buyer/dashboard" className="rounded-xl border border-[#2f7d4d]/20 px-5 py-3 font-bold text-[#17312a] text-sm">
            Cancel
          </Link>
          <button
            disabled={submitting}
            type="submit"
            className="rounded-xl bg-[#2f7d4d] px-6 py-3 font-bold text-white text-sm shadow-md transition hover:bg-[#25663e] disabled:opacity-50"
          >
            {submitting ? "Saving Requirement..." : "Post Requirement"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function BuyerMatches() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);

  useEffect(() => {
    Promise.all([getDemands(), getLots()]).then(([d, l]) => {
      setDemands(d);
      setLots(l);
    });
  }, []);

  return <MatchesSection demand={demands[0]} lots={lots} />;
}

function MatchesSection({ demand, lots }: { demand?: Demand; lots: Lot[] }) {
  const matches = useMemo(() => (demand ? scoreMatches(demand, lots) : []), [demand, lots]);
  const [offeredLot, setOfferedLot] = useState<string | null>(null);

  if (!demand) return null;

  return (
    <Section title="Matching Farmer Lots" subtitle="Algorithmically weighted by price fit, quality fit, quantity fit and seller reliability.">
      {offeredLot && (
        <div className="mb-4 rounded-xl bg-emerald-50 p-3.5 text-xs font-bold text-[#2f7d4d] border border-[#2f7d4d]/20">
          Offer sent for produce lot {offeredLot}! You can now open the deal room to negotiate.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {matches.map((match) => (
          <div key={match.lot.id} className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#17312a]">{match.lot.farmerName} - {match.lot.id}</p>
                <p className="text-xs text-[#17312a]/65">{match.lot.crop} ({match.lot.grade}) - {match.lot.quantityQt} Qt</p>
              </div>
              <span className="rounded-full bg-[#2f7d4d] px-3.5 py-1 text-xs font-black text-white shadow-sm">
                {match.total}% Match
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-[#f6f1e7] p-3 rounded-xl border border-[#2f7d4d]/10">
              <p>Price Fit: <b>{match.priceFit}%</b></p>
              <p>Quality Fit: <b>{match.qualityFit}%</b></p>
              <p>Quantity Fit: <b>{match.quantityFit}%</b></p>
              <p>Seller Reliability: <b>{match.reliability}/100</b></p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setOfferedLot(match.lot.id)}
                className="rounded-xl bg-[#2f7d4d] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#25663e]"
              >
                Send Offer
              </button>
              <Link
                to="/deal-room/DL-9001"
                className="rounded-xl border border-[#2f7d4d]/25 px-4 py-2.5 text-xs font-bold text-[#2f7d4d] hover:bg-[#2f7d4d]/5"
              >
                Open Deal Room
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
