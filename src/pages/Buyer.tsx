import { FileText, HandCoins, PackageSearch, Plus, ShieldCheck, ShoppingBasket, Store, TrendingUp } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Section, StatCard } from "../components/Cards";
import { useAuth } from "../context/AuthContext";
import { createDemand, getDeals, getDemands, getLots, scoreMatches, startDeal } from "../services/api";
import type { Crop, Deal, Demand, Grade, Lot } from "../types";
import { money } from "../utils/format";
import { EmptyState, Loading, PageHeader } from "./Market";

const inputClass = "w-full rounded-md border border-[#D8CDBB] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#B96832] focus:ring-2 focus:ring-[#B96832]/15";

export function BuyerDashboard() {
  const { user } = useAuth();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDemands(), getLots(), getDeals()])
      .then(([demandData, lotData, dealData]) => {
        setDemands(demandData);
        setLots(lotData);
        setDeals(dealData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading text="Loading buyer dashboard..." />;

  const myDemands = user ? demands.filter((demand) => demand.buyerId === user.id || demand.buyerName === user.name) : demands;
  const shownDemands = myDemands.length ? myDemands : demands;
  const firstDemand = shownDemands[0];
  const matches = firstDemand ? scoreMatches(firstDemand, lots) : [];
  const myDeals = user ? deals.filter((deal) => deal.buyerId === user.id || deal.buyer === user.name) : deals;
  const activeDeals = myDeals.filter((deal) => deal.status !== "COMPLETED");

  return (
    <div className="space-y-5">
      <PageHeader title={`Hello, ${user?.name || "Buyer"}`} subtitle="Your requirements, matching produce and deals." />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Requirements" value={String(shownDemands.length)} helper="Open needs" icon={ShoppingBasket} />
        <StatCard label="Matching Produce" value={String(matches.length)} helper="For latest requirement" icon={PackageSearch} />
        <StatCard label="Active Deals" value={String(activeDeals.length)} helper="In progress" icon={HandCoins} />
        <StatCard label="Reliability Score" value="Verified" helper="Buyer profile" icon={ShieldCheck} />
      </div>

      <section className="rounded-md border border-[#D8CDBB] bg-[#E9E1D2] p-4">
        <h2 className="font-black">Quick Actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction to="/buyer/demand" icon={Plus} label="Add Requirement" />
          <QuickAction to="/marketplace" icon={Store} label="Marketplace" />
          <QuickAction to="/price-prediction" icon={TrendingUp} label="Check Prices" />
          <QuickAction to="/deal-room" icon={FileText} label="Deal Room" />
        </div>
      </section>

      <Section title="Recent Requirements">
        <div className="overflow-x-auto rounded-md border border-[#D8CDBB] bg-white">
          {shownDemands.length === 0 ? (
            <EmptyState text="No buyer requirements found." />
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F4EFE4] text-[#765536]">
                <tr>
                  <th className="p-4">Crop</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Grade</th>
                  <th className="p-4">Mandi</th>
                  <th className="p-4">Price Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CDBB]">
                {shownDemands.slice(0, 6).map((demand) => (
                  <tr key={demand.id}>
                    <td className="p-4 font-bold">{demand.crop}</td>
                    <td className="p-4">{demand.quantityQt} qt</td>
                    <td className="p-4">{demand.grade}</td>
                    <td className="p-4">{demand.mandi}</td>
                    <td className="p-4 font-bold text-[#33291F]">{money(demand.minPrice)} - {money(demand.maxPrice)}/qt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      <Section title="My Deals" subtitle="Active negotiations, payment pending and completed trade rooms.">
        <DealList deals={myDeals} />
      </Section>

      {firstDemand && <MatchesSection demand={firstDemand} lots={lots} />}
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

  return (
    <div className="mx-auto max-w-3xl rounded-md border border-[#D8CDBB] bg-white p-5">
      <PageHeader title="Add Requirement" subtitle="Save crop demand, quantity, grade and price range to the backend." />
      {error && <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
        <Select name="crop" label="Crop" options={["Wheat", "Rice", "Mustard", "Maize", "Gram"]} />
        <Select name="grade" label="Grade" options={["FAQ", "A", "Premium", "Lab Verified", "Organic"]} />
        <Field name="quantityQt" label="Quantity (quintals)" type="number" />
        <div>
          <span className="mb-1 block text-xs font-bold text-[#765536]">Price range (Rs/qt)</span>
          <div className="grid grid-cols-2 gap-2">
            <input name="minPrice" required type="number" className={inputClass} placeholder="Min" />
            <input name="maxPrice" required type="number" className={inputClass} placeholder="Max" />
          </div>
        </div>
        <Field name="city" label="City" defaultValue="Kota" />
        <Field name="mandi" label="Mandi" defaultValue="Ramganj Mandi" />
        <div className="md:col-span-2 flex justify-end gap-3">
          <Link to="/buyer/dashboard" className="rounded-md border border-[#555633] px-5 py-3 text-sm font-bold text-[#555633]">Cancel</Link>
          <button disabled={submitting} className="rounded-md bg-[#555633] px-5 py-3 text-sm font-bold text-[#F4EFE4]">{submitting ? "Saving..." : "Save Requirement"}</button>
        </div>
      </form>
    </div>
  );
}

export function BuyerMatches() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  useEffect(() => {
    Promise.all([getDemands(), getLots()]).then(([demandData, lotData]) => {
      setDemands(demandData);
      setLots(lotData);
    });
  }, []);
  return <MatchesSection demand={demands[0]} lots={lots} />;
}

function MatchesSection({ demand, lots }: { demand?: Demand; lots: Lot[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startingLot, setStartingLot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const matches = useMemo(() => (demand ? scoreMatches(demand, lots) : []), [demand, lots]);
  if (!demand) return null;
  const activeDemand = demand;

  async function handleStartDeal(lot: Lot) {
    if (!user) return;
    setError(null);
    setStartingLot(lot.id);
    try {
      const deal = await startDeal({
        lotId: lot.id,
        quantity: Math.min(activeDemand.quantityQt, lot.quantityQt),
        pricePerUnit: lot.expectedPrice,
        message: `Initial offer for ${Math.min(activeDemand.quantityQt, lot.quantityQt)} qt of ${lot.crop}.`,
      });
      navigate(`/deal-room/${deal.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start deal.");
    } finally {
      setStartingLot(null);
    }
  }

  return (
    <Section title="Matching Produce">
      {error && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-3 md:grid-cols-2">
        {matches.length === 0 ? (
          <EmptyState text="No matching produce found for the selected requirement." />
        ) : (
          matches.slice(0, 4).map((match) => (
            <article key={match.lot.id} className="rounded-md border border-[#D8CDBB] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{match.lot.crop} - {match.lot.quantityQt} qt</p>
                  <p className="text-sm text-[#765536]">{match.lot.farmerName}, {match.lot.mandi}</p>
                </div>
                <span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#B96832]">{match.total}% match</span>
              </div>
              <p className="mt-3 text-sm font-bold text-[#33291F]">{money(match.lot.expectedPrice)}/qt</p>
              <button
                type="button"
                disabled={startingLot === match.lot.id || user?.role !== "Buyer"}
                onClick={() => handleStartDeal(match.lot)}
                className="mt-4 inline-flex rounded-md bg-[#B96832] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {startingLot === match.lot.id ? "Opening..." : "Start Deal"}
              </button>
            </article>
          ))
        )}
      </div>
    </Section>
  );
}

function DealList({ deals }: { deals: Deal[] }) {
  if (deals.length === 0) return <EmptyState text="No deals yet. Start from a matching produce lot." />;

  return (
    <div className="overflow-x-auto rounded-md border border-[#D8CDBB] bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#F4EFE4] text-[#765536]">
          <tr>
            <th className="p-4">Deal</th>
            <th className="p-4">Farmer / Produce</th>
            <th className="p-4">Quantity</th>
            <th className="p-4">Status</th>
            <th className="p-4">Payment</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D8CDBB]">
          {deals.map((deal) => (
            <tr key={deal.id}>
              <td className="p-4 font-black text-[#33291F]">{deal.id}</td>
              <td className="p-4">{deal.farmer}<span className="block text-xs text-[#765536]">{deal.crop} - {deal.lotId}</span></td>
              <td className="p-4">{deal.quantityQt} qt</td>
              <td className="p-4"><StatusPill value={deal.status} /></td>
              <td className="p-4">{deal.paymentStatus}</td>
              <td className="p-4"><Link to={`/deal-room/${deal.id}`} className="text-xs font-bold text-[#B96832] hover:underline">Open Deal Room</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  return <span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#B96832]">{value.replaceAll("_", " ")}</span>;
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
