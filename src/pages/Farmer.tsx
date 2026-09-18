import { FileText, Handshake, Package, Plus, ShieldCheck, Store, TrendingUp, Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Section, StatCard } from "../components/Cards";
import { useAuth } from "../context/AuthContext";
import { createLot, getDeals, getDemands, getLots, registerSample } from "../services/api";
import type { Crop, Deal, Demand, Grade, Lot } from "../types";
import { money } from "../utils/format";
import { EmptyState, Loading, PageHeader } from "./Market";

const inputClass = "w-full rounded-md border border-[#D8CDBB] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#B96832] focus:ring-2 focus:ring-[#B96832]/15";

export function FarmerDashboard() {
  const { user } = useAuth();
  const [lots, setLots] = useState<Lot[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLots(), getDeals(), getDemands()])
      .then(([lotData, dealData, demandData]) => {
        setLots(lotData);
        setDeals(dealData);
        setDemands(demandData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading farmer dashboard..." />;

  const myLots = user ? lots.filter((lot) => lot.farmerId === user.id || lot.farmerName === user.name) : lots;
  const shownLots = myLots.length ? myLots : lots;
  const activeDeals = deals.filter((deal) => deal.status !== "Completed");
  const reliability = shownLots.length ? Math.round(shownLots.reduce((sum, lot) => sum + lot.reliability, 0) / shownLots.length) : 0;

  return (
    <div className="space-y-5">
      <PageHeader title={`Hello, ${user?.name || "Farmer"}`} subtitle="Your produce, buyer matches and transactions." />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Produce" value={String(shownLots.length)} helper="Listed lots" icon={Package} />
        <StatCard label="Matched Buyers" value={String(demands.length)} helper="Open requirements" icon={Users} />
        <StatCard label="Active Transactions" value={String(activeDeals.length)} helper="In progress" icon={Handshake} />
        <StatCard label="Reliability Score" value={reliability ? `${reliability}%` : "No data"} helper="From listed produce" icon={ShieldCheck} />
      </div>

      <section className="rounded-md border border-[#D8CDBB] bg-[#E9E1D2] p-4">
        <h2 className="font-black">Quick Actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction to="/farmer/create-lot" icon={Plus} label="Add Produce" />
          <QuickAction to="/marketplace" icon={Store} label="Marketplace" />
          <QuickAction to="/price-prediction" icon={TrendingUp} label="Check Prices" />
          <QuickAction to="/transactions" icon={FileText} label="Transactions" />
        </div>
      </section>

      <Section title="Recent Produce">
        <div className="overflow-x-auto rounded-md border border-[#D8CDBB] bg-white">
          {shownLots.length === 0 ? (
            <EmptyState text="No produce lots found." />
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F4EFE4] text-[#765536]">
                <tr>
                  <th className="p-4">Crop</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Grade</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CDBB]">
                {shownLots.slice(0, 6).map((lot) => (
                  <tr key={lot.id}>
                    <td className="p-4 font-bold">{lot.crop}</td>
                    <td className="p-4">{lot.quantityQt} qt</td>
                    <td className="p-4">{lot.grade}</td>
                    <td className="p-4 font-bold text-[#33291F]">{money(lot.expectedPrice)}/qt</td>
                    <td className="p-4"><span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#B96832]">{lot.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Plus; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-center gap-2 rounded-md border border-[#D8CDBB] bg-white px-4 py-3 text-sm font-bold text-[#33291F] hover:border-[#B96832]">
      <Icon size={17} className="text-[#B96832]" />
      {label}
    </Link>
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

  return (
    <FormPage title="Add Produce Lot" subtitle="Save crop, quantity, grade and expected price to the backend.">
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Select name="crop" label="Crop" options={["Wheat", "Rice", "Mustard", "Maize", "Gram"]} />
        <Select name="grade" label="Grade" options={["FAQ", "A", "Premium", "Lab Verified", "Organic"]} />
        <Field name="quantityQt" label="Quantity (quintals)" type="number" />
        <Field name="expectedPrice" label="Expected price (Rs/qt)" type="number" />
        <Field name="city" label="City" defaultValue="Kota" />
        <Field name="mandi" label="Mandi" defaultValue="Ramganj Mandi" />
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-bold text-[#765536]">Quality notes</span>
          <textarea name="declaredQuality" required className={`${inputClass} min-h-28`} placeholder="Moisture, grain size, packaging..." />
        </label>
        <div className="md:col-span-2 flex justify-end gap-3">
          <Link to="/farmer/dashboard" className="rounded-md border border-[#555633] px-5 py-3 text-sm font-bold text-[#555633]">Cancel</Link>
          <button disabled={submitting} className="rounded-md bg-[#555633] px-5 py-3 text-sm font-bold text-[#F4EFE4]">{submitting ? "Saving..." : "Save Produce"}</button>
        </div>
      </form>
    </FormPage>
  );
}

export function QualityPassport() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getLots().then(setLots).catch(console.error);
  }, []);

  async function handleRegister(lotId?: string) {
    const result = await registerSample(lotId);
    setMessage(`Sample ${result.sampleId} is ${result.status}.`);
    setLots(await getLots());
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Quality" subtitle="Simple sample status, lab result and FairTrade grade." />
      {message && <div className="rounded-md border border-[#D8CDBB] bg-[#E9E1D2] p-3 text-sm font-bold text-[#B96832]">{message}</div>}
      <div className="grid gap-3 md:grid-cols-2">
        {lots.map((lot, index) => (
          <article key={lot.id} className="rounded-md border border-[#D8CDBB] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">FT-SMP-{2026 + index}</p>
                <p className="text-sm text-[#765536]">{lot.crop} / {lot.id}</p>
              </div>
              <span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#B96832]">{lot.labStatus}</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Info label="Sample Status" value={lot.labStatus} />
              <Info label="Lab Result" value={lot.labStatus === "Verified" ? "Passed" : "Pending"} />
              <Info label="FairTrade Grade" value={lot.labStatus === "Verified" ? lot.grade : "Awaited"} />
            </div>
            <button onClick={() => handleRegister(lot.id)} className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#B96832] px-3 py-2 text-xs font-bold text-white">
              <Plus size={15} />
              Register Sample
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function FarmerMatches() {
  const [demands, setDemands] = useState<Demand[]>([]);
  useEffect(() => {
    getDemands().then(setDemands).catch(console.error);
  }, []);

  return (
    <Section title="Matched Buyers">
      <div className="grid gap-3 md:grid-cols-2">
        {demands.map((demand) => (
          <article key={demand.id} className="rounded-md border border-[#D8CDBB] bg-white p-4">
            <p className="font-black">{demand.buyerName}</p>
            <p className="mt-1 text-sm text-[#765536]">{demand.crop}, {demand.quantityQt} qt, {demand.mandi}</p>
            <p className="mt-2 text-sm font-bold text-[#33291F]">{money(demand.minPrice)} - {money(demand.maxPrice)}/qt</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function FormPage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl rounded-md border border-[#D8CDBB] bg-white p-5">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ name, label, type = "text", defaultValue }: { name: string; label: string; type?: string; defaultValue?: string }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-bold text-[#765536]">{label}</span>
      <input name={name} required type={type} defaultValue={defaultValue} className={inputClass} />
    </label>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-bold text-[#765536]">{label}</span>
      <select name={name} className={inputClass}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#F4EFE4] p-3 text-sm">
      <p className="text-xs text-[#765536]">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
