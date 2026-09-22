import { FileText, Handshake, Package, Plus, ShieldCheck, Store, Trash2, TrendingUp, Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Section, StatCard } from "../components/Cards";
import { MarketFields } from "../components/MarketFields";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { createLot, deleteLot, getDeals, getDemands, getLots, registerSample } from "../services/api";
import type { Crop, Deal, Demand, Grade, Lot } from "../types";
import { money } from "../utils/format";
import { EmptyState, Loading, PageHeader } from "./Market";

const inputClass = "w-full rounded-md border border-[#D8CDBB] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#B96832] focus:ring-2 focus:ring-[#B96832]/15";

export function FarmerDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [lots, setLots] = useState<Lot[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingLotId, setDeletingLotId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard(initialLoad = false) {
      try {
        const [lotData, dealData, demandData] = await Promise.all([getLots(), getDeals(), getDemands()]);
        if (cancelled) return;
        setLots(lotData);
        setDeals(dealData);
        setDemands(demandData);
      } catch (err) {
        // Keep the last successful dashboard data while a background refresh fails.
        console.error("Error refreshing farmer dashboard:", err);
      } finally {
        if (initialLoad && !cancelled) setLoading(false);
      }
    }

    loadDashboard(true);
    const intervalId = window.setInterval(() => loadDashboard(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading) return <Loading text={t("common.loading")} />;

  const myLots = user ? lots.filter((lot) => lot.farmerId === user.id || lot.farmerName === user.name) : lots;
  const shownLots = myLots.length ? myLots : lots;
  const myDeals = user ? deals.filter((deal) => deal.farmerId === user.id || deal.farmer === user.name) : deals;
  const activeDeals = myDeals.filter((deal) => deal.status !== "COMPLETED");
  const reliability = shownLots.length ? Math.round(shownLots.reduce((sum, lot) => sum + lot.reliability, 0) / shownLots.length) : 0;

  async function handleDeleteLot(lot: Lot) {
    if (!user || lot.farmerId !== user.id) return;
    const confirmed = window.confirm(`Delete ${lot.crop} quotation?`);
    if (!confirmed) return;

    setDeleteError(null);
    setDeletingLotId(lot.id);
    try {
      await deleteLot(lot.id);
      setLots((current) => current.filter((item) => item.id !== lot.id));
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete produce lot.");
    } finally {
      setDeletingLotId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("dashboard.hello", { name: user?.name || t("role.Farmer") })} subtitle={t("dashboard.farmerSubtitle")} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("dashboard.myProduce")} value={String(shownLots.length)} helper={t("dashboard.listedLots")} icon={Package} />
        <StatCard label={t("dashboard.matchedBuyers")} value={String(demands.length)} helper={t("dashboard.openRequirements")} icon={Users} />
        <StatCard label={t("dashboard.activeTransactions")} value={String(activeDeals.length)} helper={t("dashboard.inProgress")} icon={Handshake} />
        <StatCard label={t("dashboard.reliabilityScore")} value={reliability ? `${reliability}%` : t("dashboard.noData")} helper={t("dashboard.fromListedProduce")} icon={ShieldCheck} />
      </div>

      <section className="rounded-md border border-[#D8CDBB] bg-[#E9E1D2] p-4">
        <h2 className="font-black">{t("dashboard.quickActions")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction to="/farmer/create-lot" icon={Plus} label={t("dashboard.addProduce")} />
          <QuickAction to="/marketplace" icon={Store} label={t("nav.marketplace")} />
          <QuickAction to="/price-prediction" icon={TrendingUp} label={t("dashboard.checkPrices")} />
          <QuickAction to="/deal-room" icon={FileText} label={t("nav.dealRoom")} />
        </div>
      </section>

      <Section title={t("dashboard.recentProduce")}>
        {deleteError && <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{deleteError}</p>}
        <div className="overflow-x-auto rounded-md border border-[#D8CDBB] bg-white">
          {shownLots.length === 0 ? (
            <EmptyState text={t("dashboard.noProduceLots")} />
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F4EFE4] text-[#765536]">
                <tr>
                  <th className="p-4">{t("common.crop")}</th>
                  <th className="p-4">{t("common.quantity")}</th>
                  <th className="p-4">{t("common.grade")}</th>
                  <th className="p-4">{t("common.price")}</th>
                  <th className="p-4">{t("common.status")}</th>
                  <th className="p-4">{t("common.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CDBB]">
                {shownLots.slice(0, 6).map((lot) => {
                  const canDelete = Boolean(user && lot.farmerId === user.id);
                  const deleting = deletingLotId === lot.id;
                  return (
                    <tr key={lot.id}>
                      <td className="p-4 font-bold">{lot.crop}</td>
                      <td className="p-4">{lot.quantityQt} qt</td>
                      <td className="p-4">{lot.grade}</td>
                      <td className="p-4 font-bold text-[#33291F]">{money(lot.expectedPrice)}/qt</td>
                      <td className="p-4"><span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#B96832]">{lot.status}</span></td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteLot(lot)}
                          disabled={!canDelete || deleting}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          {deleting ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      <Section title={t("dashboard.quotation")} subtitle={t("dashboard.quotationSubtitle")}>
        <DealRequests deals={myDeals} />
      </Section>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: typeof Plus; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-center gap-2 rounded-md border border-[#D8CDBB] bg-white px-4 py-3 text-sm font-bold text-[#33291F] hover:border-[#B96832]">
      <Icon size={17} className="text-[#B96832]" />
      {label}
    </Link>
  );
}

export function CreateLot() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await createLot({
        crop: form.get("crop") as Crop,
        grade: form.get("grade") as Grade,
        quantityQt: Number(form.get("quantityQt")),
        expectedPrice: Number(form.get("expectedPrice")),
        city: String(form.get("city")),
        mandi: String(form.get("mandi")),
        marketId: String(form.get("marketId")),
        declaredQuality: String(form.get("declaredQuality")),
      });
      navigate("/farmer/dashboard");
    } catch (err: any) {
      setError(err.message || t("forms.failedLot"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormPage title={t("forms.addProduceLot")} subtitle={t("forms.addProduceSubtitle")}>
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Select name="crop" label={t("common.crop")} options={["Wheat", "Rice", "Mustard", "Maize", "Gram"]} />
        <Select name="grade" label={t("common.grade")} options={["FAQ", "A", "Premium", "Lab Verified", "Organic"]} />
        <Field name="quantityQt" label={t("forms.quantityQuintals")} type="number" />
        <Field name="expectedPrice" label={t("forms.expectedPrice")} type="number" />
        <MarketFields cityLabel={t("common.city")} mandiLabel={t("common.mandi")} inputClass={inputClass} />
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-bold text-[#765536]">{t("forms.qualityNotes")}</span>
          <textarea name="declaredQuality" required className={`${inputClass} min-h-28`} placeholder={t("forms.qualityPlaceholder")} />
        </label>
        <div className="md:col-span-2 flex justify-end gap-3">
          <Link to="/farmer/dashboard" className="rounded-md border border-[#555633] px-5 py-3 text-sm font-bold text-[#555633]">{t("common.cancel")}</Link>
          <button disabled={submitting} className="rounded-md bg-[#555633] px-5 py-3 text-sm font-bold text-[#F4EFE4]">{submitting ? t("common.saving") : t("forms.saveProduce")}</button>
        </div>
      </form>
    </FormPage>
  );
}

export function QualityPassport() {
  const { t, statusLabel } = useI18n();
  const [lots, setLots] = useState<Lot[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getLots().then(setLots).catch(console.error);
  }, []);

  async function handleRegister(lotId?: string) {
    const result = await registerSample(lotId);
    setMessage(t("quality.sampleMessage", { sampleId: result.sampleId, status: statusLabel(result.status) }));
    setLots(await getLots());
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("quality.title")} subtitle={t("quality.subtitle")} />
      {message && <div className="rounded-md border border-[#D8CDBB] bg-[#E9E1D2] p-3 text-sm font-bold text-[#B96832]">{message}</div>}
      <div className="grid gap-3 md:grid-cols-2">
        {lots.map((lot) => (
          <article key={lot.id} className="rounded-md border border-[#D8CDBB] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{lot.id}</p>
                <p className="text-sm text-[#765536]">{lot.crop} / {lot.farmerId}</p>
              </div>
              <span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#B96832]">{lot.labStatus}</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Info label={t("quality.sampleStatus")} value={lot.labStatus} />
              <Info label={t("quality.labResult")} value={lot.labStatus === "Verified" ? t("quality.passed") : t("quality.pending")} />
              <Info label={t("quality.fairTradeGrade")} value={lot.labStatus === "Verified" ? lot.grade : t("quality.awaited")} />
            </div>
            <button onClick={() => handleRegister(lot.id)} className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#B96832] px-3 py-2 text-xs font-bold text-white">
              <Plus size={15} />
              {t("quality.registerSample")}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

export function FarmerMatches() {
  const { t } = useI18n();
  const [demands, setDemands] = useState<Demand[]>([]);
  useEffect(() => {
    getDemands().then(setDemands).catch(console.error);
  }, []);

  return (
    <Section title={t("dashboard.matchedBuyers")}>
      <div className="grid gap-3 md:grid-cols-2">
        {demands.map((demand) => (
          <article key={demand.id} className="rounded-md border border-[#D8CDBB] bg-white p-4">
            <p className="font-black">{demand.buyerName}</p>
            <p className="mt-1 text-sm text-[#765536]">{demand.crop}, {demand.quantityQt} qt, {demand.mandi}</p>
            <p className="mt-2 text-sm font-bold text-[#33291F]">{money(demand.minPrice)} - {money(demand.maxPrice)}/qt</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function FormPage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl rounded-md border border-[#D8CDBB] bg-white p-5">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ name, label, type = "text", defaultValue }: { name: string; label: string; type?: string; defaultValue?: string }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-bold text-[#765536]">{label}</span>
      <input name={name} required type={type} defaultValue={defaultValue} className={inputClass} />
    </label>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-bold text-[#765536]">{label}</span>
      <select name={name} className={inputClass}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#F4EFE4] p-3 text-sm">
      <p className="text-xs text-[#765536]">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function DealRequests({ deals }: { deals: Deal[] }) {
  const { t, statusLabel } = useI18n();
  if (deals.length === 0) return <EmptyState text={t("dashboard.noIncomingDeals")} />;

  return (
    <div className="overflow-x-auto rounded-md border border-[#D8CDBB] bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#F4EFE4] text-[#765536]">
          <tr>
            <th className="p-4">{t("common.buyer")}</th>
            <th className="p-4">{t("common.produce")}</th>
            <th className="p-4">{t("common.quantity")}</th>
            <th className="p-4">{t("dashboard.quotation")}</th>
            <th className="p-4">{t("common.status")}</th>
            <th className="p-4">{t("common.action")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D8CDBB]">
          {deals.map((deal) => (
            <tr key={deal.id}>
              <td className="p-4 font-bold text-[#33291F]">{deal.buyer}</td>
              <td className="p-4">
                {deal.crop}
                <span className="block text-xs text-[#765536]">{deal.lotId}</span>
                {deal.marketName && <span className="block text-xs text-[#765536]">{deal.marketName}</span>}
                <span className="block text-xs text-[#765536]">{t("deal.qualityGrade")}: {deal.grade}</span>
              </td>
              <td className="p-4">{deal.quantityQt} qt</td>
              <td className="p-4">
                <span className="block font-bold text-[#33291F]">{money(deal.offer || deal.agreedPrice)}/qt</span>
                <span className="mt-1 block text-xs text-[#765536]">{t("common.date")}: {deal.date}</span>
              </td>
              <td className="p-4"><span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#B96832]">{statusLabel(deal.status)}</span></td>
              <td className="p-4"><Link to={`/deal-room/${deal.id}`} className="text-xs font-bold text-[#B96832] hover:underline">{t("transactions.openDeal")}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
