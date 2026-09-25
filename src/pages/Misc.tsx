import { AlertCircle, Lock, Mail, Store, Tractor, User as UserIcon } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FairTradeLogo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

export function Login({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, loading, login, signup } = useAuth();
  const { t, roleLabel } = useI18n();
  const [isSignup, setIsSignup] = useState(initialMode === "signup");
  const [role, setRole] = useState<"Farmer" | "Buyer">("Farmer");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const inputClass =
    "w-full rounded-md border border-[#D8CDBB] bg-[#F4EFE4] px-4 py-3 text-sm text-[#33291F] outline-none transition placeholder:text-[#765536]/55 focus:border-[#B96832] focus:ring-2 focus:ring-[#B96832]/15";

  useEffect(() => {
    setIsSignup(initialMode === "signup");
  }, [initialMode]);

  useEffect(() => {
    if (!loading && currentUser) {
      navigate(currentUser.role === "Farmer" ? "/farmer/dashboard" : currentUser.role === "Warehouse" ? "/quality-check" : "/buyer/dashboard", { replace: true });
    }
  }, [currentUser, loading, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier") || "").trim();
    const password = String(form.get("password") || "").trim();
    const name = String(form.get("name") || "").trim();
    const confirmPassword = String(form.get("confirmPassword") || "").trim();

    try {
      if (isSignup) {
        if (!name) throw new Error(t("auth.enterName"));
        if (password !== confirmPassword) throw new Error(t("auth.passwordMismatch"));
        const user = await signup(role, name, identifier, password);
        navigate(fromPath || (user.role === "Farmer" ? "/farmer/dashboard" : user.role === "Warehouse" ? "/quality-check" : "/buyer/dashboard"));
      } else {
        const user = await login(identifier, password);
        navigate(fromPath || (user.role === "Farmer" ? "/farmer/dashboard" : user.role === "Warehouse" ? "/quality-check" : "/buyer/dashboard"));
      }
    } catch (err: any) {
      setError(err.message || t("auth.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-101px)] place-items-center bg-[#F4EFE4] px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-md border border-[#D8CDBB] bg-[#E9E1D2] shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden min-h-[620px] overflow-hidden bg-[#555633] lg:block">
          <img
            src="/assets/image2.png"
            alt="Farmer using a modern agriculture platform"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#33291F]/80 via-[#555633]/35 to-[#F4EFE4]/5" />
          <div className="absolute left-8 top-8">
            <FairTradeLogo size="lg" clickable={false} />
          </div>
          <div className="absolute bottom-8 left-8 max-w-sm text-white">
            <h1 className="text-3xl font-black leading-tight">{t("auth.simpleAccess")}</h1>
            <p className="mt-3 text-sm leading-6 text-[#F4EFE4]/85">{t("auth.heroText")}</p>
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="lg:hidden">
            <FairTradeLogo size="lg" clickable={false} />
          </div>
          <div className="mt-8 lg:mt-0">
            <h2 className="text-2xl font-black text-[#33291F]">{isSignup ? t("auth.createAccount") : t("auth.welcomeBack")}</h2>
            <p className="mt-1 text-sm text-[#765536]">{isSignup ? t("auth.join") : t("auth.loginAccount")}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-md bg-[#F4EFE4] p-1">
            {(["Farmer", "Buyer"] as const).map((option) => {
              const Icon = option === "Farmer" ? Tractor : Store;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-bold ${
                    role === option ? "bg-[#555633] text-[#F4EFE4] shadow-sm" : "text-[#765536]"
                  }`}
                >
                  <Icon size={16} />
                  {roleLabel(option)}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignup && (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#765536]">{t("auth.name")}</span>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 text-[#765536]" size={16} />
                  <input name="name" className={`${inputClass} pl-10`} placeholder={role === "Farmer" ? t("auth.farmerName") : t("auth.buyerOrganization")} />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#765536]">{t("auth.emailMobile")}</span>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-[#765536]" size={16} />
                <input name="identifier" required className={`${inputClass} pl-10`} placeholder={t("auth.emailPlaceholder")} />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#765536]">{t("auth.password")}</span>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-[#765536]" size={16} />
                <input name="password" required type="password" className={`${inputClass} pl-10`} placeholder={t("auth.password")} />
              </div>
            </label>

            {isSignup && (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#765536]">{t("auth.confirmPassword")}</span>
                <input name="confirmPassword" required type="password" className={inputClass} placeholder={t("auth.confirmPasswordPlaceholder")} />
              </label>
            )}

            <button disabled={submitting} className="w-full rounded-md bg-[#B96832] py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#9D5529] disabled:opacity-60">
              {submitting ? t("auth.pleaseWait") : isSignup ? t("auth.signUp") : t("auth.login")}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#765536]">
            {isSignup ? t("auth.alreadyAccount") : t("auth.noAccount")}{" "}
            <button className="font-bold text-[#B96832]" onClick={() => setIsSignup((value) => !value)}>
              {isSignup ? t("auth.login") : t("auth.signUp")}
            </button>
          </p>

          <p className="mt-10 text-center text-xs text-[#765536]">
            <Link to="/" className="font-bold text-[#B96832]">FairTrade</Link> {t("auth.footer")}
          </p>
        </section>
      </div>
    </div>
  );
}

export function Admin() {
  return null;
}

export function Settings() {
  return null;
}
