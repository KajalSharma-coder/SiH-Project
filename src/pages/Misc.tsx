import { Link } from "react-router-dom";
import { Section } from "../components/Cards";
import { marketQuotes } from "../data/mockData";
import { getDeals, getDemands, getLots } from "../services/storage";

export function Login() {
  return (
    <div className="mx-auto max-w-md rounded-md bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="mt-2 text-sm text-ink/60">Demo mode uses local browser state. Choose a workspace to continue.</p>
      <div className="mt-5 grid gap-3">
        <Link to="/farmer/dashboard" className="rounded-md bg-field px-4 py-3 text-center font-bold text-white">Farmer Workspace</Link>
        <Link to="/buyer/dashboard" className="rounded-md border border-field/20 px-4 py-3 text-center font-bold text-field">Buyer Workspace</Link>
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
