import { BarChart3, FileText, Handshake, Home, Landmark, Leaf, Menu, ShieldCheck, Sprout, Store } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  ["Home", "/", Home],
  ["Price Prediction", "/market", BarChart3],
  ["Farmer", "/farmer/dashboard", Sprout],
  ["Buyer", "/buyer/dashboard", Store],
  ["Quality", "/farmer/quality", ShieldCheck],
  ["Deal Room", "/deal-room/DL-9001", Handshake],
  ["Transactions", "/transactions", FileText],
  ["Price Pulse", "/price-pulse", Landmark],
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-field text-white shadow-sm" : "text-ink/70 hover:bg-white hover:text-field"}`;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfaf6_0%,#f4f7ef_48%,#eef6f2_100%)]">
      <header className="sticky top-0 z-30 border-b border-field/10 bg-[#fbfaf6]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-field text-white shadow-sm"><Leaf size={22} /></span>
            <span>
              <span className="block text-lg font-bold tracking-tight">FairTrade</span>
              <span className="block text-xs text-ink/60">Mandi marketplace platform</span>
            </span>
          </NavLink>
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.slice(0, 5).map(([label, href, Icon]) => (
              <NavLink key={href} to={href} className={linkClass} end={href === "/"}>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </nav>
          <button className="rounded-md border border-field/20 bg-white p-2 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
            <Menu size={20} />
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[232px_1fr]">
        <aside className={`${open ? "block" : "hidden"} no-print lg:block`}>
          <nav className="rounded-md border border-field/10 bg-white/82 p-3 shadow-soft backdrop-blur">
            <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-ink/45">Workflow</p>
            <div className="space-y-1">
              {navItems.map(([label, href, Icon]) => (
                <NavLink key={href} to={href} className={linkClass} end={href === "/"}>
                  <Icon size={16} /> {label}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 rounded-md bg-cream p-3 text-xs leading-5 text-ink/65">
              Login as farmer or buyer, create lots or requirements, verify samples, negotiate, and generate bills from one flow.
            </div>
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
