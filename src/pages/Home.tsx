import { ArrowRight, BadgeIndianRupee, CheckCircle2, Handshake, Landmark, LineChart, Phone, ShieldCheck, Sprout, Store, Tractor, UsersRound } from "lucide-react";
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

const heroImage = {
  src: "/assets/home-slider-1.jpg",
  alt: "Farmers checking fresh crop produce at a mandi",
} as const;

export function Home() {
  return (
    <div>
      <section
        className="relative isolate min-h-[570px] overflow-hidden border-b border-[#D8CDBB] bg-[#241B15] sm:min-h-[610px] lg:min-h-[660px]"
      >
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImage.src}
            alt={heroImage.alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#241B15]/78 via-[#33291F]/36 to-[#241B15]/20" />
          <div className="absolute inset-0 bg-[#FFF8EC]/10" />
        </div>
        <h1 className="sr-only">Fair Prices. Trusted Markets.</h1>
        <p className="sr-only">
          FairTrade connects farmers with buyers and helps them make informed, transparent and fair agricultural deals.
        </p>
        <div className="mx-auto flex min-h-[570px] max-w-[1120px] items-center px-5 pb-10 pt-8 sm:min-h-[610px] sm:px-8 lg:min-h-[660px] lg:pb-0">
          <div className="max-w-[520px] pt-6 lg:pt-0">
            <p className="mb-5 max-w-[500px] text-center text-xl font-black leading-8 text-[#33291F] drop-shadow-[0_1px_0_rgba(244,239,228,0.9)] sm:text-2xl lg:text-left">
              A trusted mandi platform for fair crop prices, direct buyer connections and transparent agricultural trade.
            </p>
            <Link to="/signup" className="mx-auto inline-flex items-center gap-2 rounded-md bg-[#B96832] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_18px_rgba(185,104,50,0.24)] transition hover:bg-[#9D5529] lg:mx-0">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
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
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
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

      <section id="stakeholders" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
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
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
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

      <section id="contact" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
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
