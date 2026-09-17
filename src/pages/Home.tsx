import { ArrowRight, BadgeCheck, BarChart3, Handshake, Landmark, Leaf, ShieldCheck, Store, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Section, StatCard } from "../components/Cards";
import { deals, marketQuotes } from "../data/mockData";
import { getLots } from "../services/storage";
import { money } from "../utils/format";

const stakeholders = [
  {
    title: "Farmers",
    icon: Leaf,
    detail: "Create produce lots, verify samples, compare prices, receive matched offers, and keep a reliability trail.",
  },
  {
    title: "Buyers",
    icon: Store,
    detail: "Post crop requirements, shortlist reliable lots, negotiate offers, and finalize direct or FairTrade-recorded deals.",
  },
  {
    title: "Mandi stakeholders",
    icon: Landmark,
    detail: "See validated local price signals, quality status, and transaction feedback that keeps the market transparent.",
  },
];

const flow = [
  ["1", "Live price intelligence", "Region, mandi, crop and grade-wise price prediction helps both sides anchor negotiations."],
  ["2", "Quality-backed lots", "Samples receive an ID, lab result and FairTrade grade before being shown as verified."],
  ["3", "Matched negotiation", "Buyer requirements are matched with farmer lots using price, quality, quantity and reliability."],
  ["4", "Digital deal record", "Every agreed deal can generate a bill, with FairTrade payment confirmations when selected."],
] as const;

export function Home() {
  const quote = marketQuotes[0];
  const completed = deals.filter((deal) => deal.status === "Completed").length;
  const activeLots = getLots().filter((lot) => lot.status !== "Sold").length;

  return (
    <div>
      <section className="overflow-hidden rounded-md border border-field/10 bg-white shadow-soft">
        <div className="grid gap-8 p-5 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-md bg-leaf/10 px-3 py-2 text-sm font-bold text-field">
              <BadgeCheck size={16} /> SIH-ready agri marketplace
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-ink sm:text-5xl">
              FairTrade connects mandi prices, verified quality and buyer-seller deals.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68">
              A clean workflow where farmers list produce, buyers post demand, quality samples build trust, and every agreed deal creates a digital bill.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/market" className="inline-flex items-center gap-2 rounded-md bg-field px-5 py-3 text-sm font-bold text-white">
                View Price Prediction <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-md border border-field/20 bg-white px-5 py-3 text-sm font-bold text-field">
                Login / Signup
              </Link>
            </div>
          </div>

          <div className="rounded-md bg-cream p-4">
            <p className="text-sm font-bold text-field">Today on FairTrade</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatCard label="Kota wheat FAQ" value={`${money(quote.currentPrice)}/Qt`} helper="Live mandi reference" icon={BarChart3} />
              <StatCard label="Active lots" value={String(activeLots)} helper="Across demo markets" icon={Leaf} />
              <StatCard label="Completed bills" value={String(completed)} helper="Digital transaction records" icon={Handshake} />
              <StatCard label="Quality verified" value="3" helper="Sample-backed lots" icon={ShieldCheck} />
            </div>
          </div>
        </div>
      </section>

      <Section title="Mandi Stakeholders" subtitle="A simple marketplace loop for farmers, buyers and local market actors.">
        <div className="grid gap-3 lg:grid-cols-3">
          {stakeholders.map(({ title, icon: Icon, detail }) => (
            <article key={title} className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-leaf/10 text-field"><Icon size={22} /></span>
              <h2 className="mt-4 text-lg font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">{detail}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="How FairTrade Works" subtitle="The platform stays focused on price clarity, trust and transaction recording.">
        <div className="grid gap-3 lg:grid-cols-4">
          {flow.map(([step, title, detail]) => (
            <div key={step} className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-field text-sm font-black text-white">{step}</span>
              <h3 className="mt-4 font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/62">{detail}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Quick Workspaces">
        <div className="grid gap-3 md:grid-cols-3">
          <Link to="/farmer/dashboard" className="group rounded-md border border-field/10 bg-white p-5 shadow-soft transition hover:border-field">
            <Users className="text-field" size={22} />
            <p className="mt-3 font-black">Farmer Dashboard</p>
            <p className="mt-1 text-sm text-ink/60">Lots, price intelligence, quality, offers and history.</p>
          </Link>
          <Link to="/buyer/dashboard" className="group rounded-md border border-field/10 bg-white p-5 shadow-soft transition hover:border-field">
            <Store className="text-field" size={22} />
            <p className="mt-3 font-black">Buyer Dashboard</p>
            <p className="mt-1 text-sm text-ink/60">Requirements, matching lots, offers and active deals.</p>
          </Link>
          <Link to="/deal-room/DL-9001" className="group rounded-md border border-field/10 bg-white p-5 shadow-soft transition hover:border-field">
            <Handshake className="text-field" size={22} />
            <p className="mt-3 font-black">Deal Room</p>
            <p className="mt-1 text-sm text-ink/60">Negotiate, choose direct/FairTrade mode and bill the deal.</p>
          </Link>
        </div>
      </Section>
    </div>
  );
}
