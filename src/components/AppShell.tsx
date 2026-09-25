import { BarChart3, FileText, Globe2, LayoutDashboard, LogOut, Menu, PackageCheck, Store, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n, type Language } from "../context/I18nContext";
import { FairTradeLogo } from "./Logo";

type NavItem = readonly [string, string, typeof Store];

const sharedItems: NavItem[] = [
  ["nav.marketplace", "/marketplace", Store],
  ["nav.pricePrediction", "/price-prediction", BarChart3],
  ["nav.dailyPrices", "/daily-prices", PackageCheck],
  ["nav.dealRoom", "/deal-room", FileText],
] as const satisfies NavItem[];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { language, setLanguage, t, roleLabel } = useI18n();
  const navigate = useNavigate();

  const dashboardHref = user?.role === "Buyer" ? "/buyer/dashboard" : "/farmer/dashboard";
  const navItems: NavItem[] = [["nav.dashboard", dashboardHref, LayoutDashboard], ...sharedItems];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
      isActive ? "bg-[#B96832] text-white shadow-sm" : "text-[#E9E1D2] hover:bg-white/10 hover:text-white"
    }`;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#F4EFE4] text-[#33291F] lg:h-screen lg:overflow-hidden">
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

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 overflow-hidden border-r border-[#45472B] bg-[#555633] px-4 py-5 transition-transform lg:translate-x-0 ${
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
                  {t(label)}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto space-y-3">
              <div className="px-3 text-[#F4EFE4]">
                <p className="text-xs font-bold">{user?.name}</p>
                <p className="text-[11px] text-[#E9E1D2]/80">{roleLabel(user?.role)}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-[#E9E1D2] hover:bg-white/10 hover:text-white"
              >
                <LogOut size={17} />
                {t("nav.logout")}
              </button>
              <label className="block px-3 text-[#F4EFE4]">
                <span className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[#E9E1D2]">
                  <Globe2 size={14} />
                  {t("language.label")}
                </span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as Language)}
                  className="w-full rounded-md border border-[#E9E1D2]/25 bg-[#4A4B2D] px-3 py-2 text-xs font-bold text-[#F4EFE4] outline-none focus:border-[#E1B083]"
                >
                  <option value="en">{t("language.english")}</option>
                  <option value="hi">{t("language.hindi")}</option>
                </select>
              </label>
            </div>
          </div>
        </aside>

        {open && <button className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu overlay" />}

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:ml-64 lg:h-screen lg:overflow-y-auto lg:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
