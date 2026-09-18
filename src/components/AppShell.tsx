import { BarChart3, FileText, LayoutDashboard, LogOut, Menu, PackageCheck, Store, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FairTradeLogo } from "./Logo";

type NavItem = readonly [string, string, typeof Store];

const sharedItems: NavItem[] = [
  ["Marketplace", "/marketplace", Store],
  ["Price Prediction", "/price-prediction", BarChart3],
  ["Daily Price Tracking", "/daily-prices", PackageCheck],
  ["Transactions", "/transactions", FileText],
] as const satisfies NavItem[];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const dashboardHref = user?.role === "Buyer" ? "/buyer/dashboard" : "/farmer/dashboard";
  const navItems: NavItem[] = [["Dashboard", dashboardHref, LayoutDashboard], ...sharedItems];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
      isActive ? "bg-[#B96832] text-white shadow-sm" : "text-[#E9E1D2] hover:bg-white/10 hover:text-white"
    }`;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#F4EFE4] text-[#33291F]">
      <header className="sticky top-0 z-40 border-b border-[#D8CDBB] bg-[#F4EFE4]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <FairTradeLogo size="sm" showSubtitle={false} />
          <button
            className="grid h-10 w-10 place-items-center rounded-md border border-[#D8CDBB] bg-[#F4EFE4] text-[#33291F]"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-[#45472B] bg-[#555633] px-4 py-5 transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="mb-7 flex items-center justify-between">
              <FairTradeLogo size="md" showSubtitle={false} variant="dark" />
              <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map(([label, href, Icon]) => (
                <NavLink key={href} to={href} end={href === "/"} className={linkClass} onClick={() => setOpen(false)}>
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto space-y-3">
              <div className="rounded-md border border-[#E9E1D2]/15 bg-white/10 p-3 text-[#F4EFE4]">
                <p className="text-sm font-bold">{user?.name}</p>
                <p className="text-xs text-[#E9E1D2]/80">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-[#E9E1D2] hover:bg-white/10 hover:text-white"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {open && <button className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu overlay" />}

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
