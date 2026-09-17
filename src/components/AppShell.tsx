import { BarChart3, FileText, Handshake, Home as HomeIcon, LogOut, Menu, ShieldCheck, Sprout, Store, User } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { FairTradeLogo } from "./Logo";
import { useAuth } from "../context/AuthContext";

const navItems = [
  ["Home", "/", HomeIcon],
  ["Live Price Prediction", "/market", BarChart3],
  ["Farmer Dashboard", "/farmer/dashboard", Sprout],
  ["Buyer Dashboard", "/buyer/dashboard", Store],
  ["Quality", "/farmer/quality", ShieldCheck],
  ["Deal Room", "/deal-room/DL-9001", Handshake],
  ["Transactions", "/transactions", FileText],
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all ${
      isActive
        ? "bg-[#2f7d4d] text-white shadow-sm font-bold"
        : "text-[#17312a]/75 hover:bg-[#2f7d4d]/10 hover:text-[#2f7d4d]"
    }`;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/50 via-[#fbfaf6] to-[#f4f7ef]">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-[#2f7d4d]/15 bg-[#fbfaf6]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <FairTradeLogo size="md" />

          {/* Header Navigation */}
          <nav className="hidden items-center gap-1 xl:flex">
            {navItems.map(([label, href, Icon]) => (
              <NavLink key={href} to={href} className={linkClass} end={href === "/"}>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </nav>

          {/* User Auth controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-800/20 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#2f7d4d]">
                  <User size={14} />
                  <span>{user.name} ({user.role})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 hover:border-red-300 shadow-sm"
                  title="Logout"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg bg-[#2f7d4d] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#25663e] shadow-sm"
              >
                Login / Signup
              </Link>
            )}

            <button
              className="rounded-lg border border-[#2f7d4d]/20 bg-white p-2 text-[#17312a] xl:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[240px_1fr]">
        <aside className={`${open ? "block" : "hidden"} no-print xl:block`}>
          <nav className="sticky top-20 rounded-xl border border-[#2f7d4d]/15 bg-white/90 p-3.5 shadow-sm backdrop-blur">
            <p className="px-3 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#17312a]/45">
              Main Menu
            </p>
            <div className="space-y-1">
              {navItems.map(([label, href, Icon]) => (
                <NavLink key={href} to={href} className={linkClass} end={href === "/"}>
                  <Icon size={16} /> {label}
                </NavLink>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-[#f6f1e7]/80 p-3.5 text-xs leading-5 text-[#17312a]/75 border border-[#2f7d4d]/10">
              <p className="font-bold text-[#2f7d4d] mb-1">FairTrade Ecosystem</p>
              Connect mandi prices, register quality, negotiate in real-time deal rooms, and generate digital bills securely.
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
