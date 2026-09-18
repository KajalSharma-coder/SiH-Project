import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { FairTradeLogo } from "./Logo";

const publicLinks = [
  ["Home", "/"],
  ["About Us", "/#about"],
  ["How It Works", "/#how-it-works"],
  ["Mandi Stakeholders", "/#stakeholders"],
  ["Contact Us", "/#contact"],
] as const;

export function PublicShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location]);

  const navClass = "rounded-md px-2.5 py-2 text-xs font-bold text-[#F4EFE4] transition hover:bg-[#F4EFE4]/14 hover:text-white";

  return (
    <div className="h-screen overflow-hidden bg-[#F4EFE4] text-[#33291F]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#F4EFE4]/12 bg-[#241B15]/95 shadow-[0_10px_28px_rgba(36,27,21,0.22)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-2.5 sm:px-8">
          <FairTradeLogo size="sm" showSubtitle={false} variant="dark" />

          <nav className="hidden items-center gap-0.5 rounded-full border border-[#F4EFE4]/16 bg-[#33291F] px-2 py-1 shadow-sm lg:flex">
            {publicLinks.map(([label, href]) => (
              <Link key={href} to={href} className={navClass}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className="rounded-md border border-[#F4EFE4]/30 bg-[#5B5046] px-4 py-2 text-xs font-bold text-[#F4EFE4] shadow-sm transition hover:bg-[#6A5E52]">
              Login
            </Link>
            <Link to="/signup" className="rounded-md bg-[#B96832] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#9D5529]">
              Sign Up
            </Link>
          </div>

          <button
            className="grid h-10 w-10 place-items-center rounded-md border border-[#F4EFE4]/30 bg-[#33291F]/70 text-[#F4EFE4] md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="mx-5 rounded-md border border-[#F4EFE4]/20 bg-[#33291F]/95 px-4 py-3 shadow-soft backdrop-blur md:hidden">
            <nav className="grid gap-1">
              {publicLinks.map(([label, href]) => (
                <Link key={href} to={href} className={navClass} onClick={() => setOpen(false)}>
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-md border border-[#F4EFE4]/35 bg-[#33291F] px-4 py-2 text-center text-sm font-bold text-[#F4EFE4]">
                Login
              </Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="rounded-md bg-[#B96832] px-4 py-2 text-center text-sm font-bold text-white">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="mt-[101px] h-[calc(100vh-101px)] overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
