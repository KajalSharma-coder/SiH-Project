import { BadgeCheck, Store, Tractor } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Section } from "../components/Cards";
import { marketQuotes } from "../data/mockData";
import { getDeals, getDemands, getLots, saveSession } from "../services/storage";
import type { SessionRole } from "../types";

export function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<SessionRole>("Farmer");
  const input = "w-full rounded-md border border-field/15 bg-white px-3 py-3 outline-none transition focus:border-field";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveSession({
      role,
      name: String(form.get("name") || (role === "Farmer" ? "Demo Farmer" : "Demo Buyer")),
      phone: String(form.get("phone") || "9876543210"),
      signedInAt: new Date().toISOString(),
    });
    navigate(role === "Farmer" ? "/farmer/dashboard" : "/buyer/dashboard");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid overflow-hidden rounded-md border border-field/10 bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-field p-6 text-white lg:p-8">
          <span className="inline-flex items-center gap-2 rounded-md bg-white/12 px-3 py-2 text-sm font-bold">
            <BadgeCheck size={16} /> FairTrade access
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight">Login / Signup</h1>
          <p className="mt-3 text-sm leading-6 text-white/78">
            Select your role once and FairTrade opens the correct workspace for listing produce, posting demand, verifying quality or closing deals.
          </p>
          <div className="mt-6 grid gap-3">
            <div className="rounded-md bg-white/10 p-4">
              <p className="font-black">Farmer</p>
              <p className="mt-1 text-sm text-white/74">Lots, price intelligence, samples, offers and bills.</p>
            </div>
            <div className="rounded-md bg-white/10 p-4">
              <p className="font-black">Buyer</p>
              <p className="mt-1 text-sm text-white/74">Requirements, matching farmers, offers and payment status.</p>
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="p-6 lg:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-field">Continue as</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["Farmer", "Buyer"] as const).map((option) => {
              const Icon = option === "Farmer" ? Tractor : Store;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`flex items-center gap-3 rounded-md border p-4 text-left transition ${role === option ? "border-field bg-leaf/10 text-field" : "border-field/10 bg-cream text-ink/70 hover:border-field/40"}`}
                >
                  <Icon size={20} />
                  <span className="font-black">{option}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-ink/70">
              Name / Organization
              <input name="name" className={input} placeholder={role === "Farmer" ? "Ramesh Meena" : "Shakti Foods Pvt Ltd"} />
            </label>
            <label className="text-sm font-semibold text-ink/70">
              Mobile number
              <input name="phone" className={input} placeholder="9876543210" />
            </label>
          </div>

          <button className="mt-5 w-full rounded-md bg-field px-5 py-3 font-bold text-white sm:w-auto">
            Open {role} Dashboard
          </button>
          <p className="mt-3 text-xs leading-5 text-ink/55">Demo login is stored only in this browser for the SIH presentation flow.</p>
        </form>
      </div>
    </div>
  );
}

export function Admin() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[["Users", 42], ["Market Data", marketQuotes.length], ["Quality", getLots().filter((lot) => lot.labStatus !== "Pending").length], ["Transactions", getDeals().length], ["Price Pulse", 14], ["Buyer Demands", getDemands().length]].map(([label, value]) => (
          <div key={label} className="rounded-md bg-white p-5 shadow-soft"><p className="text-sm text-ink/55">{label}</p><p className="mt-2 text-3xl font-black text-field">{value}</p></div>
        ))}
      </div>
      <Section title="Operational queues">
        <div className="grid gap-3 lg:grid-cols-3">
          {["User verification", "Market data review", "Quality sample tracking", "Transactions", "Price Pulse"].map((item) => <button key={item} className="rounded-md border border-field/10 bg-cream p-4 text-left font-bold hover:border-field">{item}</button>)}
        </div>
      </Section>
    </div>
  );
}

export function Settings() {
  return (
    <div className="rounded-md bg-white p-5 shadow-soft">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {["Forecast disclaimer enabled", "Light theme only", "Local demo persistence", "API-ready services"].map((item) => <label key={item} className="flex items-center gap-3 rounded-md bg-cream p-4"><input type="checkbox" defaultChecked className="h-5 w-5 accent-field" /> {item}</label>)}
      </div>
    </div>
  );
}
