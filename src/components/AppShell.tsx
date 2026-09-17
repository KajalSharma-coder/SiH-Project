import { BarChart3, FileText, Gauge, Home, Landmark, Leaf, Menu, Settings, ShieldCheck, Sprout, Store, Users } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const groups = [
  { label: "Farmer", items: [["Dashboard", "/farmer/dashboard", Sprout], ["Market", "/market", Store], ["My Lots", "/farmer/create-lot", Leaf], ["Quality", "/farmer/quality", ShieldCheck], ["Buyer Matches", "/farmer/matches", Users], ["Deal Room", "/deal-room/DL-9001", Landmark], ["Bills", "/bill/DL-9002", FileText], ["Reliability", "/reliability", Gauge]] },
  { label: "Buyer", items: [["Dashboard", "/buyer/dashboard", Store], ["Demand", "/buyer/demand", FileText], ["Seller Matches", "/buyer/matches", Users], ["Deal Room", "/deal-room/DL-9002", Landmark]] },
  { label: "Admin", items: [["Admin", "/admin", Users], ["Price Pulse", "/price-pulse", BarChart3], ["Settings", "/settings", Settings]] },
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${isActive ? "bg-field text-white" : "text-ink/75 hover:bg-white hover:text-field"}`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-field/10 bg-[#fbfaf6]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-field text-white"><Leaf size={22} /></span>
            <span>
              <span className="block text-lg font-bold tracking-tight">FairTrade</span>
              <span className="block text-xs text-ink/60">Agri market intelligence</span>
            </span>
          </NavLink>
          <button className="rounded-md border border-field/20 p-2 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
            <Menu size={20} />
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-5 lg:grid-cols-[260px_1fr]">
        <aside className={`${open ? "block" : "hidden"} no-print lg:block`}>
          <nav className="rounded-md border border-field/10 bg-cream/70 p-3 shadow-soft">
            <NavLink to="/" className={linkClass}><Home size={16} /> Home</NavLink>
            {groups.map((group) => (
              <div key={group.label} className="mt-4">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map(([label, href, Icon]) => (
                    <NavLink key={href} to={href} className={linkClass}><Icon size={16} /> {label}</NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
