import { BadgeCheck, Lock, Mail, Store, Tractor, User as UserIcon, AlertCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Section } from "../components/Cards";
import { FairTradeLogo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { marketQuotes } from "../data/mockData";
import { getDeals, getDemands, getLots } from "../services/storage";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuth();

  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState<"Farmer" | "Buyer">("Farmer");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-[#2f7d4d]/20 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#2f7d4d] focus:ring-2 focus:ring-[#2f7d4d]/15";

  const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier") || "").trim();
    const password = String(form.get("password") || "").trim();
    const name = String(form.get("name") || "").trim();

    try {
      if (isSignup) {
        if (!name) {
          setError("Please enter your name or organization.");
          setSubmitting(false);
          return;
        }
        const newUser = await signup(role, name, identifier, password);
        const target = newUser.role === "Farmer" ? "/farmer/dashboard" : "/buyer/dashboard";
        navigate(fromPath || target);
      } else {
        const loggedUser = await login(identifier, password);
        const target = loggedUser.role === "Farmer" ? "/farmer/dashboard" : "/buyer/dashboard";
        navigate(fromPath || target);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-6">
      <div className="grid overflow-hidden rounded-2xl border border-[#2f7d4d]/15 bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left Branding Side */}
        <section className="bg-gradient-to-br from-[#2f7d4d] via-[#23603a] to-[#17312a] p-8 text-white flex flex-col justify-between">
          <div>
            <FairTradeLogo variant="dark" size="lg" clickable={false} />
            <div className="mt-8 space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-emerald-200">
                <BadgeCheck size={16} /> Real Database Authentication
              </span>
              <h1 className="text-3xl font-black tracking-tight leading-tight">
                {isSignup ? "Create your FairTrade account" : "Welcome back to FairTrade"}
              </h1>
              <p className="text-sm leading-relaxed text-emerald-100/80">
                Join verified farmers and buyers to access direct mandi price intelligence, quality passport records, and digital deal rooms.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3">
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur">
              <p className="font-bold text-sm text-emerald-200">Farmer Account</p>
              <p className="text-xs text-white/75 mt-0.5">Post produce lots, track mandi prices, get buyer matches & bills.</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur">
              <p className="font-bold text-sm text-emerald-200">Buyer Account</p>
              <p className="text-xs text-white/75 mt-0.5">Post requirement demands, find quality verified sellers & negotiate deals.</p>
            </div>
          </div>
        </section>

        {/* Right Form Side */}
        <div className="p-8">
          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-[#f6f1e7] p-1 mb-6 border border-[#2f7d4d]/10">
            <button
              type="button"
              onClick={() => { setIsSignup(false); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-extrabold transition ${!isSignup ? "bg-white text-[#2f7d4d] shadow-sm" : "text-[#17312a]/60 hover:text-[#17312a]"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setIsSignup(true); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-extrabold transition ${isSignup ? "bg-white text-[#2f7d4d] shadow-sm" : "text-[#17312a]/60 hover:text-[#17312a]"}`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection for Signup */}
            {isSignup && (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#17312a]/65 mb-2">
                  Select Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["Farmer", "Buyer"] as const).map((opt) => {
                    const Icon = opt === "Farmer" ? Tractor : Store;
                    const isSelected = role === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setRole(opt)}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-[#2f7d4d] bg-[#2f7d4d]/10 text-[#2f7d4d] font-bold"
                            : "border-[#2f7d4d]/15 bg-[#f6f1e7]/40 text-[#17312a]/70 hover:border-[#2f7d4d]/40"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Name input (only for signup) */}
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-[#17312a]/80 mb-1">
                  Full Name / Organization
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-3.5 text-[#17312a]/40" />
                  <input
                    name="name"
                    required
                    type="text"
                    placeholder={role === "Farmer" ? "e.g. Ramesh Meena" : "e.g. Shakti Foods Pvt Ltd"}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            )}

            {/* Identifier input */}
            <div>
              <label className="block text-xs font-semibold text-[#17312a]/80 mb-1">
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-[#17312a]/40" />
                <input
                  name="identifier"
                  required
                  type="text"
                  placeholder="ramesh@fairtrade.org or 9876543210"
                  defaultValue={!isSignup ? "ramesh@fairtrade.org" : ""}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-xs font-semibold text-[#17312a]/80 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-[#17312a]/40" />
                <input
                  name="password"
                  required
                  type="password"
                  placeholder="Enter password"
                  defaultValue={!isSignup ? "password123" : ""}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={submitting}
              type="submit"
              className="mt-2 w-full rounded-xl bg-[#2f7d4d] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#25663e] disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </span>
              ) : isSignup ? (
                `Create ${role} Account`
              ) : (
                "Login to Dashboard"
              )}
            </button>
          </form>

          {/* Quick Demo Hint */}
          <div className="mt-6 rounded-xl bg-[#f6f1e7]/80 p-3 text-xs text-[#17312a]/70 border border-[#2f7d4d]/10">
            <p className="font-bold text-[#2f7d4d] mb-0.5">Default Demo Credentials:</p>
            <p>• Farmer: <code className="bg-white px-1.5 py-0.5 rounded font-mono">ramesh@fairtrade.org</code> / <code className="bg-white px-1.5 py-0.5 rounded font-mono">password123</code></p>
            <p className="mt-0.5">• Buyer: <code className="bg-white px-1.5 py-0.5 rounded font-mono">shakti@fairtrade.org</code> / <code className="bg-white px-1.5 py-0.5 rounded font-mono">password123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Admin() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ["Users", 42],
          ["Market Data", marketQuotes.length],
          ["Quality", getLots().filter((lot) => lot.labStatus !== "Pending").length],
          ["Transactions", getDeals().length],
          ["Price Pulse", 14],
          ["Buyer Demands", getDemands().length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-5 shadow-soft border border-[#2f7d4d]/10">
            <p className="text-sm text-[#17312a]/60 font-semibold">{label}</p>
            <p className="mt-2 text-3xl font-black text-[#2f7d4d]">{value}</p>
          </div>
        ))}
      </div>
      <Section title="Operational queues">
        <div className="grid gap-3 lg:grid-cols-3">
          {["User verification", "Market data review", "Quality sample tracking", "Transactions", "Price Pulse"].map(
            (item) => (
              <button
                key={item}
                className="rounded-xl border border-[#2f7d4d]/10 bg-[#f6f1e7] p-4 text-left font-bold text-[#17312a] hover:border-[#2f7d4d]"
              >
                {item}
              </button>
            )
          )}
        </div>
      </Section>
    </div>
  );
}

export function Settings() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-soft border border-[#2f7d4d]/10">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {["Forecast disclaimer enabled", "Light theme only", "Backend API Persistence", "JWT Authentication Enabled"].map((item) => (
          <label key={item} className="flex items-center gap-3 rounded-xl bg-[#f6f1e7] p-4 text-sm font-semibold text-[#17312a]">
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-[#2f7d4d]" /> {item}
          </label>
        ))}
      </div>
    </div>
  );
}
