import { FileText, Handshake, Package, Plus, ShieldCheck, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ForecastChart } from "../components/ForecastChart";
import { Section, StatCard } from "../components/Cards";
import { useAuth } from "../context/AuthContext";
import { createLot, getDeals, getDemands, getLots, getMarketQuotes, registerSample } from "../services/api";
import type { Crop, Deal, Demand, Grade, Lot, MarketQuote } from "../types";
import { money } from "../utils/format";

export function FarmerDashboard() {
  const { user } = useAuth();
  const [lots, setLots] = useState<Lot[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [lData, dData, demData, qData] = await Promise.all([
          getLots(),
          getDeals(),
          getDemands(),
          getMarketQuotes(),
        ]);
        setLots(lData);
        setDeals(dData);
        setDemands(demData);
        setQuotes(qData);
      } catch (err) {
        console.error("Error loading farmer dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const farmerLots = user ? lots.filter((l) => l.farmerId === user.id || l.farmerName === user.name) : lots;
  const displayLots = farmerLots.length > 0 ? farmerLots : lots;
  const activeLots = displayLots.filter((lot) => lot.status === "Active" || lot.status === "Matched").length;
  const quote = quotes[0];

  if (loading) {
    return (
      <div className="grid min-h-[400px] place-items-center rounded-2xl bg-white p-8 shadow-soft">
        <div className="flex items-center gap-3 text-[#2f7d4d] font-semibold">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#2f7d4d] border-t-transparent" />
          Loading Farmer Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#17312a]">Farmer Dashboard</h1>
          <p className="text-sm text-[#17312a]/65 mt-0.5">
            Manage produce lots, quality passports, buyer matches, offers and transaction history.
          </p>
          {user && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#2f7d4d]/10 px-3 py-1 text-xs font-bold text-[#2f7d4d]">
              Profile: {user.name} ({user.identifier})
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/farmer/create-lot"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2f7d4d] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#25663e]"
          >
            <Plus size={18} /> Create Produce Lot
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Live Market Price" value={quote ? `${money(quote.currentPrice)}/Qt` : "Rs 2,645/Qt"} helper="Kota Wheat FAQ" icon={TrendingUp} />
        <StatCard label="My Produce Lots" value={String(displayLots.length)} helper={`${activeLots} active lots`} icon={Package} />
        <StatCard label="Matched Buyers" value={String(demands.length)} helper="Available requirements" icon={Users} />
        <StatCard label="Active Deals" value={String(deals.length)} helper="Negotiating / Agreed" icon={Handshake} />
        <StatCard label="Reliability Score" value="94/100" helper="Verified Seller Profile" icon={ShieldCheck} />
      </div>

      {/* Forecast & Quality Section */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#17312a]">Mandi Price Intelligence</h2>
              <p className="text-xs text-[#17312a]/60">7-day indicative mandi forecast based on market signals.</p>
            </div>
            <Link to="/market" className="text-xs font-bold text-[#2f7d4d] hover:underline">
              Open Full Market
            </Link>
          </div>
          {quote && <ForecastChart data={quote.forecast} height={250} />}
        </section>

        <section className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-black text-[#17312a]">Quality & Sample Passports</h2>
          <p className="text-xs text-[#17312a]/60 mb-4">Sample status for lab testing and grade verification.</p>
          <div className="space-y-3">
            {displayLots.slice(0, 3).map((lot) => (
              <div key={lot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f6f1e7] p-3.5 border border-[#2f7d4d]/10">
                <div>
                  <p className="font-bold text-sm text-[#17312a]">{lot.id} - {lot.crop} ({lot.grade})</p>
                  <p className="text-xs text-[#17312a]/65 mt-0.5">{lot.declaredQuality}</p>
                </div>
                <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${lot.labStatus === "Verified" ? "bg-emerald-100 text-[#2f7d4d]" : "bg-white text-[#17312a]/70"}`}>
                  {lot.labStatus}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/farmer/quality"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#2f7d4d]/25 px-4 py-2.5 text-xs font-bold text-[#2f7d4d] hover:bg-[#2f7d4d]/5"
          >
            <ShieldCheck size={16} /> Open Quality Passport
          </Link>
        </section>
      </div>

      {/* Produce Lots List */}
      <Section title="My Produce Lots">
        <div className="grid gap-4 lg:grid-cols-2">
          {displayLots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      </Section>

      {/* Offers & Deals */}
      <Section title="Offers & Agreed Deals">
        <div className="grid gap-4 lg:grid-cols-2">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              to={`/deal-room/${deal.id}`}
              className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-5 shadow-soft transition hover:border-[#2f7d4d]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#17312a]">{deal.crop} - Lot {deal.lotId}</p>
                  <p className="text-xs text-[#17312a]/65 mt-0.5">Buyer: {deal.buyer}</p>
                </div>
                <span className="rounded-full bg-[#2f7d4d]/10 px-3 py-1 text-xs font-bold text-[#2f7d4d]">
                  {deal.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap justify-between items-center text-xs text-[#17312a]/80 bg-[#f6f1e7] p-3 rounded-xl border border-[#2f7d4d]/10">
                <span>Agreed Rate: <b className="text-sm font-black text-[#2f7d4d]">{money(deal.agreedPrice)}/Qt</b></span>
                <span>Quantity: <b className="text-sm text-[#17312a]">{deal.quantityQt} Qt</b></span>
                <span>Mode: <b>{deal.transactionMode}</b></span>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

function LotCard({ lot }: { lot: Lot }) {
  return (
    <div className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#17312a]">{lot.id} - {lot.crop}</p>
          <p className="text-xs text-[#17312a]/65">{lot.city} - {lot.mandi}</p>
        </div>
        <span className="rounded-full bg-[#2f7d4d]/10 px-3 py-1 text-xs font-bold text-[#2f7d4d]">
          {lot.status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-[#f6f1e7]/60 p-3 rounded-xl border border-[#2f7d4d]/10">
        <p className="text-[#17312a]/70">Grade: <b className="text-[#17312a]">{lot.grade}</b></p>
        <p className="text-[#17312a]/70">Quantity: <b className="text-[#17312a]">{lot.quantityQt} Qt</b></p>
        <p className="text-[#17312a]/70">Expected Price: <b className="text-[#2f7d4d] font-bold">{money(lot.expectedPrice)}/Qt</b></p>
        <p className="text-[#17312a]/70">Reliability: <b className="text-[#17312a]">{lot.reliability}/100</b></p>
      </div>
      <p className="mt-3 text-xs text-[#17312a]/75"><b>Quality Notes:</b> {lot.declaredQuality}</p>
      <p className="mt-1 text-xs font-bold text-sky-700 flex items-center gap-1">
        <CheckCircle2 size={14} /> Lab Status: {lot.labStatus}
      </p>
    </div>
  );
}

export function CreateLot() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      await createLot({
        crop: form.get("crop") as Crop,
        grade: form.get("grade") as Grade,
        quantityQt: Number(form.get("quantityQt")),
        expectedPrice: Number(form.get("expectedPrice")),
        city: String(form.get("city")),
        mandi: String(form.get("mandi")),
        declaredQuality: String(form.get("declaredQuality")),
      });
      navigate("/farmer/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create lot.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#2f7d4d]/20 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#2f7d4d] focus:ring-2 focus:ring-[#2f7d4d]/15";

  return (
    <div className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-6 shadow-soft max-w-3xl mx-auto">
      <h1 className="text-3xl font-black tracking-tight text-[#17312a]">Create Produce Lot</h1>
      <p className="mt-1 text-sm text-[#17312a]/65">
        Add crop, quantity, expected price and quality parameters to save in database and match with buyers.
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
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">Category / Grade</label>
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
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">Expected Price (Rs/Qt)</label>
          <input name="expectedPrice" required type="number" min="1" placeholder="e.g. 2680" className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">City</label>
          <input name="city" required placeholder="City" defaultValue="Kota" className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">Mandi</label>
          <input name="mandi" required placeholder="Mandi" defaultValue="Ramganj Mandi" className={inputClass} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-1">Declared Quality Description</label>
          <textarea
            name="declaredQuality"
            required
            placeholder="Moisture %, admixture, grain size, packaging details..."
            className={`${inputClass} min-h-28`}
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
          <Link to="/farmer/dashboard" className="rounded-xl border border-[#2f7d4d]/20 px-5 py-3 font-bold text-[#17312a] text-sm">
            Cancel
          </Link>
          <button
            disabled={submitting}
            type="submit"
            className="rounded-xl bg-[#2f7d4d] px-6 py-3 font-bold text-white text-sm shadow-md transition hover:bg-[#25663e] disabled:opacity-50"
          >
            {submitting ? "Saving to Database..." : "Save Active Lot"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function QualityPassport() {
  const [sampleMsg, setSampleMsg] = useState<string | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);

  useEffect(() => {
    getLots().then(setLots).catch(console.error);
  }, []);

  async function handleRegisterSample() {
    try {
      const res = await registerSample(lots[0]?.id);
      setSampleMsg(`Sample registered! Generated Sample ID: ${res.sampleId}. Status: ${res.status}`);
    } catch (err) {
      console.error(err);
    }
  }

  const steps = [
    ["Sample Registration", "Create a traceable sample entry for a produce lot."],
    ["Generate Sample ID", "Unique ID assigned for laboratory tracking."],
    ["Sample Testing", "Submitted, received, lab testing in progress."],
    ["Lab Result", "Moisture %, admixture, and category verified."],
    ["FairTrade Grade", "Verified grade displayed to buyers on deal room."],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#17312a]">Quality Passport & Verification</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#17312a]/65">
              Traceable lab sample verification process that turns declared farmer quality into an official FairTrade grade.
            </p>
          </div>
          <button
            onClick={handleRegisterSample}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2f7d4d] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#25663e]"
          >
            <Plus size={16} /> Register New Sample
          </button>
        </div>

        {sampleMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-xs font-bold text-[#2f7d4d] border border-[#2f7d4d]/20">
            {sampleMsg}
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {steps.map(([step, detail], index) => (
            <div key={step} className="rounded-xl border border-[#2f7d4d]/10 bg-[#f6f1e7]/80 p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#2f7d4d]">Step {index + 1}</p>
              <p className="mt-1.5 font-black text-sm text-[#17312a]">{step}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#17312a]/65">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <Section title="Sample Verification Records">
        <div className="grid gap-4 lg:grid-cols-2">
          {lots.slice(0, 4).map((lot, index) => (
            <div key={lot.id} className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#17312a]">FT-SMP-2026-{1044 + index}</p>
                  <p className="text-xs text-[#17312a]/65">{lot.id} - {lot.crop} - {lot.grade}</p>
                </div>
                <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${lot.labStatus === "Verified" ? "bg-emerald-100 text-[#2f7d4d]" : "bg-[#f6f1e7] text-[#17312a]/70"}`}>
                  {lot.labStatus}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#f6f1e7] p-3 text-xs">
                  <span className="text-[#17312a]/60">Moisture</span>
                  <b className="block text-sm text-[#17312a] mt-0.5">{index % 2 ? "12.4%" : "11.8%"}</b>
                </div>
                <div className="rounded-xl bg-[#f6f1e7] p-3 text-xs">
                  <span className="text-[#17312a]/60">Admixture</span>
                  <b className="block text-sm text-[#17312a] mt-0.5">{index % 2 ? "1.6%" : "1.1%"}</b>
                </div>
                <div className="rounded-xl bg-[#f6f1e7] p-3 text-xs">
                  <span className="text-[#17312a]/60">FairTrade Grade</span>
                  <b className="block text-sm text-[#2f7d4d] mt-0.5">{lot.labStatus === "Verified" ? lot.grade : "Awaited"}</b>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export function FarmerMatches() {
  const [demands, setDemands] = useState<Demand[]>([]);
  useEffect(() => {
    getDemands().then(setDemands).catch(console.error);
  }, []);

  return (
    <Section title="Matched Buyer Requirements" subtitle="Buyers currently looking for produce matching your active mandi region.">
      <div className="grid gap-4 lg:grid-cols-2">
        {demands.map((demand) => (
          <div key={demand.id} className="rounded-2xl border border-[#2f7d4d]/15 bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#17312a]">{demand.buyerName}</p>
                <p className="text-xs text-[#17312a]/65">{demand.crop} - {demand.quantityQt} Qt - {demand.city}</p>
              </div>
              <span className="rounded-full bg-[#2f7d4d]/10 px-3 py-1 text-xs font-bold text-[#2f7d4d]">Good Fit</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-[#f6f1e7] p-3 rounded-xl">
              <p>Grade: <b>{demand.grade}</b></p>
              <p>Price Range: <b>{money(demand.minPrice)}-{money(demand.maxPrice)}</b></p>
            </div>
            <Link
              to="/deal-room/DL-9001"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2f7d4d] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
            >
              <FileText size={16} /> Open Deal Room
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}
