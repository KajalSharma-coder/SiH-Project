import { ArrowRight, BadgeIndianRupee, CheckCircle2, Handshake, Landmark, LineChart, Phone, Scale, ShieldCheck, Sprout, Store, Tractor, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { FairTradeLogo } from "../components/Logo";

const aboutCards = [
  ["Sell Your Produce", Sprout, "Connect your produce with potential buyers."],
  ["Know the Market", LineChart, "Understand daily prices and price trends."],
  ["Trade Fairly", Handshake, "Make transparent deals with buyers."],
] as const;

const steps = [
  ["Add Your Produce", Sprout],
  ["Check Market Prices", BadgeIndianRupee],
  ["Connect With Buyers", UsersRound],
  ["Complete Your Deal", ShieldCheck],
] as const;

const stakeholders = [
  ["Farmer", Tractor, "List produce, review prices and find buyers who value quality."],
  ["Buyer", Store, "Discover reliable crop lots and connect directly with sellers."],
  ["Mandi Stakeholder", Landmark, "Support cleaner market information and trusted trade records."],
] as const;

const benefits = ["Transparent Deals", "Price Intelligence", "Trusted Quality", "Direct Buyer-Seller Connection"] as const;

function HeroIllustration() {
  return (
    <div className="relative min-h-[360px] lg:min-h-[420px]">
      <div className="absolute bottom-4 right-1 h-16 w-16 rounded-sm border border-[#765536]/40 text-[#765536] shadow-[0_12px_24px_rgba(51,41,31,0.16)] sm:right-4">
        <div className="grid h-full place-items-center">
          <Scale size={34} strokeWidth={1.5} />
        </div>
      </div>

      <div className="absolute bottom-10 left-2 h-24 w-24 rounded-[48%_52%_44%_56%] bg-[#E9E1D2] shadow-[inset_-12px_-10px_22px_rgba(118,85,54,0.16),0_16px_24px_rgba(51,41,31,0.16)] sm:left-8" />
      <div className="absolute bottom-24 left-16 h-5 w-20 rounded-full bg-[#765536]/35 blur-sm" />
      <div className="absolute bottom-20 left-24 flex gap-1.5">
        {Array.from({ length: 7 }).map((_, index) => (
          <span key={index} className="h-2.5 w-3 rounded-full bg-[#765536] shadow-sm" />
        ))}
      </div>

      <div className="absolute bottom-4 right-14 w-[78%] max-w-[520px] sm:right-20">
        <div className="relative rounded-md bg-[#E9E1D2] p-6 shadow-[0_28px_48px_rgba(51,41,31,0.26),inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-[#765536]/20">
          <div className="absolute inset-0 rounded-md bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.55),transparent_32%),linear-gradient(145deg,rgba(244,239,228,0.95),rgba(216,205,187,0.56))]" />
          <div className="relative mx-auto max-w-[360px] rounded-t-full border-[7px] border-[#765536] border-b-0 px-8 pb-6 pt-8">
            <div className="absolute left-1/2 top-0 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-[#B96832] bg-[#555633] text-[#F4EFE4] shadow-[0_10px_20px_rgba(51,41,31,0.22)]">
              <Sprout size={38} strokeWidth={1.8} />
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4">
            {["Crop", "Price", "Deal"].map((label) => (
              <div key={label} className="rounded-sm bg-[#F4EFE4] px-3 py-3 text-center shadow-[0_8px_10px_rgba(51,41,31,0.18),inset_0_1px_0_rgba(255,255,255,0.85)]">
                <p className="text-[11px] font-black text-[#765536]">{label}</p>
                <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-[#B96832]" />
              </div>
            ))}
            </div>
          </div>
          <div className="relative mx-auto mt-2 h-16 w-[86%] rounded-t-full bg-[linear-gradient(180deg,#9B724B,#5F432D)] shadow-[inset_0_6px_8px_rgba(255,255,255,0.18)]" />
          <div className="relative mx-auto grid w-[92%] grid-cols-5 gap-2 px-2">
            {["#F4EFE4", "#E9E1D2", "#B96832", "#A45C35", "#765536", "#765536", "#9B724B", "#F4EFE4", "#C8AF8B", "#E9E1D2"].map((color, index) => (
              <span
                key={index}
                className="h-11 rounded-t-full shadow-[inset_-5px_-7px_10px_rgba(51,41,31,0.18),0_6px_10px_rgba(51,41,31,0.12)]"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Home() {
  return (
    <div>
      <section className="relative isolate -mt-px min-h-[410px] overflow-hidden border-b border-[#D8CDBB] bg-[#E9E1D2]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_9%_27%,rgba(185,104,50,0.16)_0_0,transparent_76px),radial-gradient(circle_at_76%_12%,rgba(255,255,255,0.52),transparent_260px),linear-gradient(100deg,rgba(244,239,228,0.94)_0%,rgba(233,225,210,0.82)_48%,rgba(197,184,160,0.68)_100%)]" />
        <div className="absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(rgba(118,85,54,0.18)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
        <div className="absolute bottom-0 left-0 right-0 -z-10 h-24 bg-[linear-gradient(180deg,rgba(244,239,228,0),rgba(118,85,54,0.24)),linear-gradient(90deg,#C7B49A,#E2D4BE,#BFA382)]" />
        <div className="absolute bottom-20 right-[39%] -z-10 h-16 w-28 rounded-full bg-[#33291F]/12 blur-2xl" />
        <div className="mx-auto grid min-h-[410px] max-w-[1120px] gap-8 px-5 py-9 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-7">
          <div className="flex flex-col justify-center pb-8 lg:pb-0">
            <FairTradeLogo size="lg" clickable={false} />
            <h1 className="mt-7 max-w-xl text-4xl font-black leading-[0.98] text-[#241B15] sm:text-5xl lg:text-[42px]">
              Fair Prices. Trusted Markets.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#765536]">
              FairTrade connects farmers with buyers and helps them make informed, transparent and fair agricultural deals.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-md bg-[#B96832] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_18px_rgba(185,104,50,0.24)] transition hover:bg-[#9D5529]">
                Get Started <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-md border border-[#D8CDBB] bg-[#F4EFE4]/82 px-5 py-3 text-sm font-bold text-[#33291F] shadow-sm transition hover:bg-[#F4EFE4]">
                Login
              </Link>
            </div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase text-[#B96832]">About FairTrade</p>
          <h2 className="mt-2 text-3xl font-black text-[#33291F]">Connecting Farmers With Better Opportunities</h2>
          <p className="mt-3 text-sm leading-7 text-[#765536]">
            FairTrade brings essential market information, buyer connections and trade records into one simple agriculture platform.
          </p>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {aboutCards.map(([title, Icon, detail], index) => (
            <article key={title} className="rounded-md border border-[#D8CDBB] bg-[#E9E1D2] p-5 shadow-sm">
              <span className={`grid h-11 w-11 place-items-center rounded-full ${index === 1 ? "bg-[#B96832]" : "bg-[#555633]"} text-[#F4EFE4]`}>
                <Icon size={21} />
              </span>
              <h3 className="mt-4 font-black text-[#33291F]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#765536]">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#E9E1D2]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-[#33291F]">How It Works</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, Icon], index) => (
              <article key={title} className="rounded-md border border-[#D8CDBB] bg-[#F4EFE4] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#555633] text-xs font-black text-[#F4EFE4]">{index + 1}</span>
                  <Icon className="text-[#B96832]" size={19} />
                </div>
                <p className="mt-4 text-sm font-black text-[#33291F]">{title}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="stakeholders" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-black text-[#33291F]">Mandi Stakeholders</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {stakeholders.map(([title, Icon, detail]) => (
            <article key={title} className="rounded-md border border-[#D8CDBB] bg-[#F4EFE4] p-5 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E9E1D2] text-[#555633]">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-black text-[#33291F]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#765536]">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#F4EFE4]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-[#33291F]">Why FairTrade</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((title) => (
              <div key={title} className="flex items-center gap-3 rounded-md border border-[#D8CDBB] bg-[#E9E1D2] p-4">
                <CheckCircle2 className="shrink-0 text-[#B96832]" size={20} />
                <p className="text-sm font-black text-[#33291F]">{title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 rounded-md bg-[#555633] p-7 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-black text-[#F4EFE4]">Ready to trade smarter?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#E9E1D2]">
              Start with a simple account and enter the FairTrade workspace built for your role.
            </p>
          </div>
          <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#B96832] px-5 py-3 text-sm font-bold text-white">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="bg-[#33291F]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-[#E9E1D2] sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <FairTradeLogo size="sm" showSubtitle={false} variant="dark" />
            <p className="mt-3 max-w-md leading-6">A warm, trusted digital agriculture platform for fair market connections.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-bold">
            {["Home", "About Us", "How It Works", "Contact Us"].map((label) => (
              <Link key={label} to={label === "Home" ? "/" : `/#${label === "About Us" ? "about" : label === "How It Works" ? "how-it-works" : "contact"}`} className="hover:text-[#E1B083]">
                {label}
              </Link>
            ))}
            <Link to="/login" className="hover:text-[#E1B083]">Login</Link>
            <Link to="/signup" className="hover:text-[#E1B083]">Sign Up</Link>
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Phone size={15} className="text-[#B96832]" />
            <span>Contact Us for mandi partnership and platform support.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
