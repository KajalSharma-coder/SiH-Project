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

  const navClass = "rounded-md px-3 py-2 text-sm font-bold text-[#765536] transition hover:bg-[#E9E1D2] hover:text-[#33291F]";

  return (
    <div className="min-h-screen bg-[#F4EFE4] text-[#33291F]">
      <header className="sticky top-0 z-40 border-b border-[#D8CDBB] bg-[#F4EFE4]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <FairTradeLogo size="md" showSubtitle={false} />

          <nav className="hidden items-center gap-1 md:flex">
            {publicLinks.map(([label, href]) => (
              <Link key={href} to={href} className={navClass}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className="rounded-md border border-[#555633] bg-[#F4EFE4] px-4 py-2 text-sm font-bold text-[#555633] transition hover:bg-[#E9E1D2]">
              Login
            </Link>
            <Link to="/signup" className="rounded-md bg-[#B96832] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#9D5529]">
              Sign Up
            </Link>
          </div>

          <button
            className="grid h-10 w-10 place-items-center rounded-md border border-[#D8CDBB] bg-[#F4EFE4] text-[#33291F] md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-[#D8CDBB] bg-[#F4EFE4] px-4 py-3 md:hidden">
            <nav className="grid gap-1">
              {publicLinks.map(([label, href]) => (
                <Link key={href} to={href} className={navClass} onClick={() => setOpen(false)}>
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-md border border-[#555633] bg-[#F4EFE4] px-4 py-2 text-center text-sm font-bold text-[#555633]">
                Login
              </Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="rounded-md bg-[#B96832] px-4 py-2 text-center text-sm font-bold text-white">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
