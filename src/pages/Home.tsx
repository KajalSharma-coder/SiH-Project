import { ArrowRight, BadgeCheck, BarChart3, Handshake, Landmark, Leaf, ShieldCheck, Store, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Section, StatCard } from "../components/Cards";
import { getDeals, getLots, getMarketQuotes } from "../services/api";
import type { Deal, Lot, MarketQuote } from "../types";
import { money } from "../utils/format";

const stakeholders = [
  {
    title: "Farmers",
    icon: Leaf,
    detail: "Create produce lots, verify quality samples, compare live mandi prices, receive buyer matches, and build reliability.",
  },
  {
    title: "Buyers",
    icon: Store,
    detail: "Post crop requirements, find quality verified lots, negotiate counter-offers, and finalize direct or FairTrade deals.",
  },
  {
    title: "Mandi Stakeholders",
    icon: Landmark,
    detail: "Access transparent regional price signals, quality passport status, and verified deal records across mandis.",
  },
];

const flow = [
  ["1", "Live Price Intelligence", "Region, mandi, crop and grade-wise price prediction helps both sides anchor negotiations."],
  ["2", "Quality-backed Lots", "Produce samples receive an ID, lab status and FairTrade verified grade before deal matching."],
  ["3", "Matched Negotiation", "Buyer requirements are matched with farmer lots using price, quality, quantity and reliability."],
  ["4", "Digital Deal Record", "Every agreed transaction generates a bill with FairTrade payment confirmations."],
] as const;

export function Home() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [qData, lData, dData] = await Promise.all([getMarketQuotes(), getLots(), getDeals()]);
        setQuotes(qData);
        setLots(lData);
        setDeals(dData);
      } catch (err) {
        console.error("Error loading home page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const topQuote = quotes[0];
  const completedDeals = deals.filter((d) => d.status === "Completed").length;
  const activeLots = lots.filter((l) => l.status !== "Sold").length;
  const verifiedLots = lots.filter((l) => l.labStatus === "Verified").length;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="overflow-hidden rounded-2xl border border-[#2f7d4d]/15 bg-white shadow-soft">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#2f7d4d]/10 px-3.5 py-1.5 text-xs font-bold text-[#2f7d4d]">
              <BadgeCheck size={16} /> Verified Mandi Marketplace Platform
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-[#17312a] sm:text-4xl lg:text-5xl leading-tight">
              FairTrade connects mandi prices, verified quality and buyer-seller deals.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#17312a]/75">
              A transparent agri-commerce platform where farmers list produce lots, buyers post crop demands, quality sample passports build trust, and every deal creates a digital bill.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/market"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2f7d4d] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#25663e]"
              >
                View Price Prediction <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-[#2f7d4d]/25 bg-white px-5 py-3 text-sm font-bold text-[#2f7d4d] transition hover:bg-[#2f7d4d]/5"
              >
                Login / Signup
              </Link>
            </div>
          </div>

          {/* Quick Metrics Panel */}
          <div className="rounded-xl bg-[#f6f1e7] p-5 border border-[#2f7d4d]/10 flex flex-col justify-between">
            <div>
              <p className="text-sm font-bold text-[#2f7d4d]">Live Market Overview</p>
              <p className="text-xs text-[#17312a]/60 mt-0.5">Real-time database metrics</p>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-[#17312a]/60">Loading live quotes...</div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <StatCard
                  label="Kota Wheat FAQ"
                  value={topQuote ? `${money(topQuote.currentPrice)}/Qt` : "Rs 2,645/Qt"}
                  helper="Live mandi reference"
                  icon={BarChart3}
                />
                <StatCard label="Active Lots" value={String(activeLots)} helper="Listed produce" icon={Leaf} />
                <StatCard label="Completed Bills" value={String(completedDeals)} helper="Digital deal records" icon={Handshake} />
                <StatCard label="Lab Verified" value={String(verifiedLots)} helper="Passport verified" icon={ShieldCheck} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <Section title="Mandi Stakeholders" subtitle="A unified marketplace for farmers, buyers and mandi actors.">
        <div className="grid gap-4 md:grid-cols-3">
          {stakeholders.map(({ title, icon: Icon, detail }) => (
            <article key={title} className="rounded-xl border border-[#2f7d4d]/10 bg-white p-6 shadow-soft transition hover:border-[#2f7d4d]/30">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#2f7d4d]/10 text-[#2f7d4d]">
                <Icon size={24} />
              </span>
              <h2 className="mt-4 text-lg font-black text-[#17312a]">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#17312a]/70">{detail}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* How FairTrade Works */}
      <Section title="How FairTrade Works" subtitle="Empowering transparent agricultural trading with digitized records.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {flow.map(([step, title, detail]) => (
            <div key={step} className="rounded-xl border border-[#2f7d4d]/10 bg-white p-5 shadow-soft">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#2f7d4d] text-sm font-black text-white">
                {step}
              </span>
              <h3 className="mt-4 font-black text-[#17312a]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#17312a]/65">{detail}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Quick Workspaces Navigation */}
      <Section title="FairTrade Workspaces">
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            to="/farmer/dashboard"
            className="group rounded-xl border border-[#2f7d4d]/10 bg-white p-5 shadow-soft transition hover:border-[#2f7d4d] hover:shadow-md"
          >
            <Users className="text-[#2f7d4d]" size={24} />
            <p className="mt-3 font-black text-lg text-[#17312a]">Farmer Workspace</p>
            <p className="mt-1 text-sm text-[#17312a]/65">Produce lots, price intelligence, sample status, offers & bills.</p>
          </Link>
          <Link
            to="/buyer/dashboard"
            className="group rounded-xl border border-[#2f7d4d]/10 bg-white p-5 shadow-soft transition hover:border-[#2f7d4d] hover:shadow-md"
          >
            <Store className="text-[#2f7d4d]" size={24} />
            <p className="mt-3 font-black text-lg text-[#17312a]">Buyer Workspace</p>
            <p className="mt-1 text-sm text-[#17312a]/65">Crop requirements, matching lots, offers & active deals.</p>
          </Link>
          <Link
            to="/deal-room/DL-9001"
            className="group rounded-xl border border-[#2f7d4d]/10 bg-white p-5 shadow-soft transition hover:border-[#2f7d4d] hover:shadow-md"
          >
            <Handshake className="text-[#2f7d4d]" size={24} />
            <p className="mt-3 font-black text-lg text-[#17312a]">Deal Room & Invoice</p>
            <p className="mt-1 text-sm text-[#17312a]/65">Chat, choose direct or FairTrade recording, and generate digital bills.</p>
          </Link>
        </div>
      </Section>
    </div>
  );
}
