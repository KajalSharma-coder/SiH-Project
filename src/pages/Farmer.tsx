import { BadgeCheck, Handshake, Package, Plus, ShieldCheck, TrendingUp } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ForecastChart } from "../components/ForecastChart";
import { Section, StatCard } from "../components/Cards";
import { activities, marketQuotes } from "../data/mockData";
import { getLots, saveLot } from "../services/storage";
import type { Crop, Grade, Lot } from "../types";
import { money } from "../utils/format";

export function FarmerDashboard() {
  const lots = getLots();
  const quote = marketQuotes[0];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Farmer Dashboard</h1><p className="text-sm text-ink/60">Live prices, produce lots, matches, and quality signals.</p></div>
        <Link to="/farmer/create-lot" className="inline-flex items-center gap-2 rounded-md bg-field px-4 py-3 text-sm font-bold text-white"><Plus size={16} /> Create Lot</Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Market price" value={`${money(quote.currentPrice)}/Qt`} helper="Kota wheat FAQ" icon={TrendingUp} />
        <StatCard label="Active Lots" value={String(lots.filter((lot) => lot.status === "Active").length)} icon={Package} />
        <StatCard label="Buyer Matches" value="12" helper="+3 today" icon={Handshake} />
        <StatCard label="Pending Deals" value="2" icon={BadgeCheck} />
        <StatCard label="Reliability" value="92/100" helper="Strong seller profile" icon={ShieldCheck} />
      </div>
      <Section title="7-day forecast" subtitle="7-Day Indicative Forecast — actual prices may vary."><div className="rounded-md bg-white p-4 shadow-soft"><ForecastChart data={quote.forecast} /></div></Section>
      <Section title="My Produce Lots">
        <div className="grid gap-3 lg:grid-cols-2">
          {lots.map((lot) => <LotCard key={lot.id} lot={lot} />)}
        </div>
      </Section>
      <Section title="Recent activity">
        <div className="rounded-md bg-white shadow-soft">
          {activities.map((item) => <div key={item.id} className="border-b border-field/10 p-4 last:border-0"><p className="font-bold">{item.title}</p><p className="text-sm text-ink/60">{item.detail} · {item.time}</p></div>)}
        </div>
      </Section>
    </div>
  );
}

function LotCard({ lot }: { lot: Lot }) {
  return (
    <div className="rounded-md border border-field/10 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{lot.id} · {lot.crop}</p><p className="text-sm text-ink/60">{lot.city} · {lot.mandi}</p></div><span className="rounded-md bg-leaf/10 px-2 py-1 text-xs font-bold text-field">{lot.status}</span></div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><p>Grade <b>{lot.grade}</b></p><p>Qty <b>{lot.quantityQt} Qt</b></p><p>Ask <b>{money(lot.expectedPrice)}/Qt</b></p><p>Reliability <b>{lot.reliability}/100</b></p></div>
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
  return <FormPage title="Create Produce Lot" onSubmit={submit} saved={saved} />;
}

function FormPage({ title, onSubmit, saved }: { title: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; saved: boolean }) {
  const input = "rounded-md border border-field/15 bg-white px-3 py-3 outline-none focus:border-field";
  return (
    <div className="rounded-md bg-white p-5 shadow-soft">
      <h1 className="text-2xl font-bold">{title}</h1>
      {saved && <p className="mt-3 rounded-md bg-leaf/10 p-3 text-sm font-semibold text-field">Lot saved locally and added to demo dashboards.</p>}
      <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
        <select name="crop" className={input}><option>Wheat</option><option>Rice</option><option>Mustard</option><option>Maize</option><option>Gram</option></select>
        <select name="grade" className={input}><option>FAQ</option><option>A</option><option>Premium</option><option>Lab Verified</option><option>Organic</option></select>
        <input name="quantityQt" required type="number" min="1" placeholder="Quantity in quintals" className={input} />
        <input name="expectedPrice" required type="number" min="1" placeholder="Expected price / quintal" className={input} />
        <input name="city" required placeholder="City" defaultValue="Kota" className={input} />
        <input name="mandi" required placeholder="Mandi" defaultValue="Ramganj Mandi" className={input} />
        <textarea name="declaredQuality" required placeholder="Farmer-declared quality" className={`${input} md:col-span-2`} />
        <button className="rounded-md bg-field px-5 py-3 font-bold text-white md:w-max">Create Active Lot</button>
      </form>
    </div>
  );
}

export function QualityPassport() {
  const steps = ["Sample ID", "Postal Submission", "Receiving Point", "Laboratory", "Lab Result", "FairTrade Grade"];
  return (
    <div className="rounded-md bg-white p-5 shadow-soft">
      <h1 className="text-2xl font-bold">Quality Passport</h1>
      <p className="mt-1 text-sm text-ink/60">Quality certification is laboratory-backed. Photo or farmer declarations are captured separately and do not certify grade alone.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => <div key={step} className="rounded-md border border-field/10 bg-cream p-4"><p className="text-sm text-ink/55">Step {index + 1}</p><p className="font-bold">{step}</p></div>)}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-field/10 p-4"><h2 className="font-bold">Farmer-declared quality</h2><p className="mt-2 text-sm text-ink/65">Moisture, appearance, admixture, packaging and storage notes submitted by the farmer.</p></div>
        <div className="rounded-md border border-field/10 p-4"><h2 className="font-bold">Lab verification</h2><p className="mt-2 text-sm text-ink/65">Physical sample tested through receiving point and partner laboratory workflow.</p></div>
        <div className="rounded-md border border-field/10 p-4"><h2 className="font-bold">FairTrade Grade</h2><p className="mt-2 text-sm text-ink/65">Displayed only after lab-backed checks, with traceable sample ID and result status.</p></div>
      </div>
    </div>
  );
}

export function FarmerMatches() {
  return <FarmerDashboard />;
}
