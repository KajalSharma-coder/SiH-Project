import { FileText, Handshake, Package, Plus, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ForecastChart } from "../components/ForecastChart";
import { Section, StatCard } from "../components/Cards";
import { activities, demands, marketQuotes } from "../data/mockData";
import { getDeals, getLots, getSession, saveLot } from "../services/storage";
import type { Crop, Grade, Lot } from "../types";
import { money } from "../utils/format";

export function FarmerDashboard() {
  const lots = getLots();
  const deals = getDeals();
  const session = getSession();
  const quote = marketQuotes[0];
  const activeLots = lots.filter((lot) => lot.status === "Active" || lot.status === "Matched").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Farmer Dashboard</h1>
          <p className="text-sm text-ink/60">Manage produce lots, quality status, buyer matches, offers and transaction history.</p>
          {session?.role === "Farmer" && <p className="mt-1 text-xs font-bold text-field">Signed in as {session.name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/login" className="rounded-md border border-field/20 bg-white px-4 py-3 text-sm font-bold text-field">Login / Signup</Link>
          <Link to="/farmer/create-lot" className="inline-flex items-center gap-2 rounded-md bg-field px-4 py-3 text-sm font-bold text-white"><Plus size={16} /> Create Lot</Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Market price" value={`${money(quote.currentPrice)}/Qt`} helper="Kota wheat FAQ" icon={TrendingUp} />
        <StatCard label="Active lots" value={String(activeLots)} icon={Package} />
        <StatCard label="Matched buyers" value={String(demands.length)} helper="+3 today" icon={Users} />
        <StatCard label="Offers / deals" value={String(deals.length)} icon={Handshake} />
        <StatCard label="Reliability" value="92/100" helper="Strong seller profile" icon={ShieldCheck} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Price intelligence</h2>
              <p className="text-sm text-ink/60">7-day indicative mandi forecast.</p>
            </div>
            <Link to="/market" className="text-sm font-bold text-field">Open market</Link>
          </div>
          <ForecastChart data={quote.forecast} height={260} />
        </section>

        <section className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black">Quality and sample status</h2>
          <div className="mt-4 space-y-3">
            {lots.slice(0, 3).map((lot) => (
              <div key={lot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-cream p-3">
                <div>
                  <p className="font-bold">{lot.id} - {lot.crop}</p>
                  <p className="text-sm text-ink/60">{lot.declaredQuality}</p>
                </div>
                <span className={`rounded-md px-3 py-2 text-xs font-bold ${lot.labStatus === "Verified" ? "bg-leaf/15 text-field" : "bg-white text-ink/65"}`}>{lot.labStatus}</span>
              </div>
            ))}
          </div>
          <Link to="/farmer/quality" className="mt-4 inline-flex items-center gap-2 rounded-md border border-field/20 px-4 py-2 text-sm font-bold text-field">
            <ShieldCheck size={16} /> View verification
          </Link>
        </section>
      </div>

      <Section title="My Produce Lots">
        <div className="grid gap-3 lg:grid-cols-2">
          {lots.map((lot) => <LotCard key={lot.id} lot={lot} />)}
        </div>
      </Section>

      <Section title="Offers, Deals and Transaction History">
        <div className="grid gap-3 lg:grid-cols-2">
          {deals.map((deal) => (
            <Link key={deal.id} to={`/deal-room/${deal.id}`} className="rounded-md border border-field/10 bg-white p-4 shadow-soft transition hover:border-field">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{deal.crop} - {deal.lotId}</p>
                  <p className="text-sm text-ink/60">{deal.buyer} offered {money(deal.offer)}/Qt</p>
                </div>
                <span className="rounded-md bg-leaf/10 px-3 py-2 text-xs font-bold text-field">{deal.status}</span>
              </div>
              <p className="mt-3 text-sm text-ink/65">Agreed: <b>{money(deal.agreedPrice)}/Qt</b> for <b>{deal.quantityQt} Qt</b></p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Recent Activity">
        <div className="rounded-md border border-field/10 bg-white shadow-soft">
          {activities.map((item) => (
            <div key={item.id} className="border-b border-field/10 p-4 last:border-0">
              <p className="font-bold">{item.title}</p>
              <p className="text-sm text-ink/60">{item.detail} - {item.time}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function LotCard({ lot }: { lot: Lot }) {
  return (
    <div className="rounded-md border border-field/10 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">{lot.id} - {lot.crop}</p>
          <p className="text-sm text-ink/60">{lot.city} - {lot.mandi}</p>
        </div>
        <span className="rounded-md bg-leaf/10 px-2 py-1 text-xs font-bold text-field">{lot.status}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <p>Grade <b>{lot.grade}</b></p>
        <p>Qty <b>{lot.quantityQt} Qt</b></p>
        <p>Ask <b>{money(lot.expectedPrice)}/Qt</b></p>
        <p>Reliability <b>{lot.reliability}/100</b></p>
      </div>
      <p className="mt-3 text-sm text-ink/65">Declared: {lot.declaredQuality}</p>
      <p className="mt-1 text-sm font-semibold text-skyline">Lab verification: {lot.labStatus}</p>
    </div>
  );
}

export function CreateLot() {
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveLot({
      id: `LOT-${Math.floor(2000 + Math.random() * 7000)}`,
      farmerId: "F-DEMO",
      farmerName: "Demo Farmer",
      crop: form.get("crop") as Crop,
      grade: form.get("grade") as Grade,
      declaredQuality: String(form.get("declaredQuality")),
      labStatus: "Pending",
      quantityQt: Number(form.get("quantityQt")),
      expectedPrice: Number(form.get("expectedPrice")),
      city: String(form.get("city")),
      mandi: String(form.get("mandi")),
      reliability: 86,
      status: "Active",
    });
    setSaved(true);
    event.currentTarget.reset();
  }
  return <FormPage title="Create / Manage Produce Lot" onSubmit={submit} saved={saved} />;
}

function FormPage({ title, onSubmit, saved }: { title: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; saved: boolean }) {
  const input = "rounded-md border border-field/15 bg-white px-3 py-3 outline-none transition focus:border-field";
  return (
    <div className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-ink/60">Add crop, quantity, expected price and quality notes so buyers can match accurately.</p>
      {saved && <p className="mt-3 rounded-md bg-leaf/10 p-3 text-sm font-semibold text-field">Lot saved locally and added to demo dashboards.</p>}
      <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
        <select name="crop" className={input}><option>Wheat</option><option>Rice</option><option>Mustard</option><option>Maize</option><option>Gram</option></select>
        <select name="grade" className={input}><option>FAQ</option><option>A</option><option>Premium</option><option>Lab Verified</option><option>Organic</option></select>
        <input name="quantityQt" required type="number" min="1" placeholder="Quantity in quintals" className={input} />
        <input name="expectedPrice" required type="number" min="1" placeholder="Expected price / quintal" className={input} />
        <input name="city" required placeholder="City" defaultValue="Kota" className={input} />
        <input name="mandi" required placeholder="Mandi" defaultValue="Ramganj Mandi" className={input} />
        <textarea name="declaredQuality" required placeholder="Moisture, admixture, grain size, packaging notes" className={`${input} min-h-28 md:col-span-2`} />
        <button className="rounded-md bg-field px-5 py-3 font-bold text-white md:w-max">Create Active Lot</button>
      </form>
    </div>
  );
}

export function QualityPassport() {
  const [registeredSample, setRegisteredSample] = useState<string | null>(null);
  const steps = [
    ["Sample registration", "Create a traceable sample entry for a produce lot."],
    ["Generate Sample ID", "FT-SMP-2026-1044 assigned for lab tracking."],
    ["Sample status", "Submitted, received, testing, result uploaded."],
    ["Lab result", "Moisture, admixture and grade checks are recorded."],
    ["FairTrade grade", "Verified grade is shown to buyers before deal closure."],
  ] as const;
  const lots = getLots();

  return (
    <div>
      <section className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Quality / Sample Verification</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink/60">A simple sample workflow that turns farmer-declared quality into a traceable FairTrade grade.</p>
          </div>
          <button
            onClick={() => setRegisteredSample(`FT-SMP-2026-${Math.floor(3000 + Math.random() * 6000)}`)}
            className="inline-flex items-center gap-2 rounded-md bg-field px-4 py-3 text-sm font-bold text-white"
          >
            <Plus size={16} /> Register Sample
          </button>
        </div>
        {registeredSample && (
          <div className="mt-4 rounded-md bg-leaf/10 p-4 text-sm font-semibold text-field">
            Sample registered. Generated Sample ID: {registeredSample}. Status: Submitted for lab review.
          </div>
        )}
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {steps.map(([step, detail], index) => (
            <div key={step} className="rounded-md border border-field/10 bg-cream p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-field">Step {index + 1}</p>
              <p className="mt-2 font-black">{step}</p>
              <p className="mt-2 text-xs leading-5 text-ink/60">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <Section title="Sample Status">
        <div className="grid gap-3 lg:grid-cols-2">
          {lots.slice(0, 4).map((lot, index) => (
            <div key={lot.id} className="rounded-md border border-field/10 bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">FT-SMP-2026-{1044 + index}</p>
                  <p className="text-sm text-ink/60">{lot.id} - {lot.crop} - {lot.grade}</p>
                </div>
                <span className={`rounded-md px-3 py-2 text-xs font-bold ${lot.labStatus === "Verified" ? "bg-leaf/15 text-field" : "bg-cream text-ink/65"}`}>{lot.labStatus}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <p className="rounded-md bg-cream p-3 text-sm">Moisture<b className="block text-ink">{index % 2 ? "12.4%" : "11.8%"}</b></p>
                <p className="rounded-md bg-cream p-3 text-sm">Admixture<b className="block text-ink">{index % 2 ? "1.6%" : "1.1%"}</b></p>
                <p className="rounded-md bg-cream p-3 text-sm">FairTrade Grade<b className="block text-ink">{lot.labStatus === "Verified" ? lot.grade : "Awaited"}</b></p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export function FarmerMatches() {
  const lots = getLots();
  return (
    <Section title="Matched Buyers" subtitle="Buyers whose requirements fit your active lots.">
      <div className="grid gap-3 lg:grid-cols-2">
        {demands.map((demand) => {
          const lot = lots.find((item) => item.crop === demand.crop && item.city === demand.city) ?? lots[0];
          return (
            <div key={demand.id} className="rounded-md border border-field/10 bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{demand.buyerName}</p>
                  <p className="text-sm text-ink/60">{demand.crop} - {demand.quantityQt} Qt - {demand.city}</p>
                </div>
                <span className="rounded-md bg-leaf/10 px-3 py-2 text-xs font-bold text-field">Good fit</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <p>Lot <b>{lot.id}</b></p>
                <p>Quality <b>{demand.grade}</b></p>
                <p>Price range <b>{money(demand.minPrice)}-{money(demand.maxPrice)}</b></p>
                <p>Status <b>Offer-ready</b></p>
              </div>
              <Link to="/deal-room/DL-9001" className="mt-4 inline-flex items-center gap-2 rounded-md bg-field px-4 py-2 text-sm font-bold text-white">
                <FileText size={16} /> Open Deal Room
              </Link>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
