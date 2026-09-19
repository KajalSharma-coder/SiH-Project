import { Filter, HandCoins, Package, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDemands, getLots, startDeal } from "../services/api";
import type { Demand, Lot } from "../types";
import { money } from "../utils/format";

const inputClass = "rounded-md border border-[#D8CDBB] bg-white px-3 py-2 text-sm outline-none focus:border-[#B96832] focus:ring-2 focus:ring-[#B96832]/15";

function unique(values: string[]) {
  return ["All", ...Array.from(new Set(values.filter(Boolean)))];
}

export function Marketplace() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [crop, setCrop] = useState("All");
  const [region, setRegion] = useState("All");
  const [grade, setGrade] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLots(), getDemands()])
      .then(([lotData, demandData]) => {
        setLots(lotData);
        setDemands(demandData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredLots = useMemo(
    () =>
      lots.filter(
        (lot) =>
          (crop === "All" || lot.crop === crop) &&
          (region === "All" || lot.city === region || lot.mandi === region) &&
          (grade === "All" || lot.grade === grade),
      ),
    [lots, crop, region, grade],
  );

  if (loading) {
    return <Loading text="Loading marketplace..." />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Marketplace" subtitle="Available produce lots and buyer requirements from the database." />

      <section className="rounded-md border border-[#D8CDBB] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Filter size={17} className="text-[#B96832]" />
          Filters
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <select value={crop} onChange={(event) => setCrop(event.target.value)} className={inputClass}>
            {unique(lots.map((lot) => lot.crop)).map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={region} onChange={(event) => setRegion(event.target.value)} className={inputClass}>
            {unique(lots.flatMap((lot) => [lot.city, lot.mandi])).map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={grade} onChange={(event) => setGrade(event.target.value)} className={inputClass}>
            {unique(lots.map((lot) => lot.grade)).map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {filteredLots.length === 0 ? (
            <EmptyState text="No produce lots match these filters." />
          ) : (
            filteredLots.map((lot) => <LotMarketCard key={lot.id} lot={lot} />)
          )}
        </div>

        <aside className="rounded-md border border-[#D8CDBB] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Search size={17} className="text-[#B96832]" />
            <h2 className="font-black">Buyer Requirements</h2>
          </div>
          <div className="mt-4 space-y-3">
            {demands.slice(0, 5).map((demand) => (
              <div key={demand.id} className="rounded-md bg-[#F4EFE4] p-3 text-sm">
                <p className="font-bold">{demand.crop} - {demand.quantityQt} qt</p>
                <p className="mt-1 text-xs text-[#765536]">{demand.buyerName} wants {demand.grade} in {demand.mandi}</p>
                <p className="mt-2 text-xs font-bold text-[#33291F]">{money(demand.minPrice)} - {money(demand.maxPrice)}/qt</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

export function Market() {
  return <Marketplace />;
}

function LotMarketCard({ lot }: { lot: Lot }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartDeal() {
    setError(null);
    setStarting(true);
    try {
      const deal = await startDeal({
        lotId: lot.id,
        quantity: lot.quantityQt,
        pricePerUnit: lot.expectedPrice,
        message: `Initial offer for ${lot.quantityQt} qt of ${lot.crop}.`,
      });
      navigate(`/deal-room/${deal.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start deal.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <article className="rounded-md border border-[#D8CDBB] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#E9E1D2] text-[#B96832]">
            <Package size={22} />
          </span>
          <div>
            <h2 className="font-black">{lot.crop}</h2>
            <p className="text-sm text-[#765536]">{lot.mandi}, {lot.city}</p>
            <p className="mt-2 text-xs text-[#765536]">Farmer reliability: <b>{lot.reliability}%</b></p>
          </div>
        </div>
        <div className="grid gap-2 text-sm sm:min-w-[360px] sm:grid-cols-4">
          <Info label="Quantity" value={`${lot.quantityQt} qt`} />
          <Info label="Grade" value={lot.grade} />
          <Info label="Price" value={`${money(lot.expectedPrice)}/qt`} />
          <Info label="Status" value={lot.status} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/transactions" className="inline-flex items-center gap-2 rounded-md border border-[#555633] px-3 py-2 text-xs font-bold text-[#555633]">
          View Details
        </Link>
        <button
          type="button"
          disabled={starting || user?.role !== "Buyer"}
          onClick={handleStartDeal}
          className="inline-flex items-center gap-2 rounded-md bg-[#B96832] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <HandCoins size={15} />
          {starting ? "Opening..." : "Start Deal"}
        </button>
      </div>
      {error && <p className="mt-3 text-xs font-bold text-red-700">{error}</p>}
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#F4EFE4] p-2">
      <p className="text-[11px] text-[#765536]">{label}</p>
      <p className={`mt-0.5 font-bold ${label === "Price" ? "text-[#33291F]" : ""}`}>{value}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-black">{title}</h1>
      <p className="mt-1 text-sm text-[#765536]">{subtitle}</p>
    </div>
  );
}

export function Loading({ text }: { text: string }) {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-md border border-[#D8CDBB] bg-white p-8 text-sm font-bold text-[#B96832]">
      {text}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-md border border-[#D8CDBB] bg-white p-8 text-center text-sm text-[#765536]">{text}</div>;
}
