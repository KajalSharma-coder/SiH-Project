import { AlertCircle, BarChart3, CheckCircle2, Download, FileText, HandCoins, Handshake, IndianRupee, MessageSquare, Printer, RefreshCcw, Send, XCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Section, StatCard } from "../components/Cards";
import { FairTradeLogo } from "../components/Logo";
import { acceptDealOffer, getChatMessages, getDealById, getDealOffers, getDeals, getMlPrediction, markPaymentReceived, markPaymentSent, rejectDealOffer, sendChatMessage, sendCounterOffer, sendDealOffer } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import type { ChatMessage, Deal, DealOffer, MLPredictionResponse } from "../types";
import { money, number } from "../utils/format";

export function DealRoom() {
  const { id = "DL-9001" } = useParams();
  const { user } = useAuth();
  const { t, roleLabel, statusLabel, paymentLabel } = useI18n();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [offers, setOffers] = useState<DealOffer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceInsight, setPriceInsight] = useState<MLPredictionResponse | null>(null);
  const [priceInsightLoading, setPriceInsightLoading] = useState(false);
  const [priceInsightError, setPriceInsightError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [dData, offerData, mData] = await Promise.all([
          getDealById(id),
          getDealOffers(id),
          getChatMessages(id),
        ]);
        setDeal(dData);
        setOffers(offerData);
        setMessages(mData);
      } catch (err: any) {
        console.error("Error loading deal room:", err);
        setError(err.message || t("deal.notFound"));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  useEffect(() => {
    if (!deal || !deal.crop || !deal.marketState || !deal.marketCity || !deal.marketName) return;

    let cancelled = false;
    setPriceInsightLoading(true);
    setPriceInsightError(null);

    getMlPrediction({
      crop: deal.crop,
      state: deal.marketState,
      district: deal.marketCity,
      market: deal.marketName,
      predictionDays: 7,
    })
      .then((prediction) => {
        if (!cancelled) setPriceInsight(prediction);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setPriceInsight(null);
          setPriceInsightError(err.message || "AI fair price insight is unavailable right now.");
        }
      })
      .finally(() => {
        if (!cancelled) setPriceInsightLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deal?.id, deal?.crop, deal?.marketState, deal?.marketCity, deal?.marketName]);

  if (loading) {
    return (
      <div className="grid min-h-[400px] place-items-center rounded-2xl bg-white p-8 shadow-soft">
        <div className="flex items-center gap-3 text-[#B96832] font-semibold">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#B96832] border-t-transparent" />
          {t("deal.loadingRoom")}
        </div>
      </div>
    );
  }

  if (!deal) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error || t("deal.notFound")}</div>;
  }

  const isBuyer = user?.id === deal.buyerId;
  const isFarmer = user?.id === deal.farmerId;
  const latestOffer = offers[offers.length - 1];
  const canRespondToLatest = latestOffer && latestOffer.senderId !== user?.id && !["COMPLETED", "REJECTED", "CANCELLED"].includes(deal.status);
  const currentPrice = latestOffer?.pricePerUnit || deal.agreedPrice || deal.offer || deal.counterOffer;
  const currentQuantity = latestOffer?.quantity || deal.quantityQt;
  const total = currentPrice * currentQuantity;
  const isCompleted = deal.status === "COMPLETED";

  async function reloadDeal() {
    const [dData, offerData] = await Promise.all([getDealById(deal!.id), getDealOffers(deal!.id)]);
    setDeal(dData);
    setOffers(offerData);
  }

  async function handleOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setActing(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      quantity: Number(form.get("quantity")),
      pricePerUnit: Number(form.get("pricePerUnit")),
      message: String(form.get("offerMessage") || "").trim(),
    };
    try {
      if (offers.length === 0 || isBuyer) {
        await sendDealOffer(deal!.id, payload);
      } else {
        await sendCounterOffer(deal!.id, payload);
      }
      event.currentTarget.reset();
      await reloadDeal();
    } catch (err: any) {
      setError(err.message || t("deal.failedOffer"));
    } finally {
      setActing(false);
    }
  }

  async function handleDealAction(action: "accept" | "reject" | "payment-sent" | "payment-received") {
    setError(null);
    setActing(true);
    try {
      const updated =
        action === "accept" ? await acceptDealOffer(deal!.id) :
        action === "reject" ? await rejectDealOffer(deal!.id) :
        action === "payment-sent" ? await markPaymentSent(deal!.id) :
        await markPaymentReceived(deal!.id);
      setDeal(updated);
      if (action === "accept" || action === "reject") {
        setOffers(await getDealOffers(deal!.id));
      }
    } catch (err: any) {
      setError(err.message || t("deal.actionFailed"));
    } finally {
      setActing(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("message") || "").trim();
    if (!text) return;
    setSending(true);

    try {
      const newMsg = await sendChatMessage(deal!.id, text);
      setMessages((prev) => [...prev, newMsg]);
      event.currentTarget.reset();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E9E1D2] px-3.5 py-1.5 text-xs font-bold text-[#B96832]">
            <Handshake size={16} /> {isBuyer ? t("deal.buyerRoom") : isFarmer ? t("deal.farmerRoom") : t("deal.room")}
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#33291F]">{t("deal.title", { id: deal.id })}</h1>
          <p className="text-sm text-[#765536] mt-0.5">
            {t("deal.subtitle")}
          </p>
        </div>
        {isCompleted ? (
          <Link
            to={`/bill/${deal.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B96832] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#9D5529]"
          >
            <FileText size={18} /> {t("deal.viewBill")}
          </Link>
        ) : (
          <div className="inline-flex max-w-sm items-center gap-2 rounded-xl border border-[#D8CDBB] bg-white px-4 py-3 text-sm font-bold text-[#765536]">
            <AlertCircle size={18} className="shrink-0 text-[#B96832]" />
            {t("deal.billLocked", { status: statusLabel(deal.status) })}
          </div>
        )}
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={["AGREED", "PAYMENT_PENDING", "PAYMENT_SENT", "COMPLETED"].includes(deal.status) ? t("deal.agreedRate") : t("deal.currentOffer")} value={`${money(currentPrice)}/Qt`} icon={IndianRupee} />
        <StatCard label={t("deal.totalAmount")} value={money(total)} icon={IndianRupee} />
        <StatCard label={t("deal.dealStatus")} value={statusLabel(deal.status)} icon={RefreshCcw} />
        <StatCard label={t("deal.paymentStatus")} value={paymentLabel(deal.paymentStatus)} icon={IndianRupee} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-[#D8CDBB] bg-white p-6 shadow-soft space-y-6">
          <div>
            <h2 className="text-xl font-black text-[#33291F]">{t("deal.summary")}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                [isBuyer ? t("common.farmer") : t("common.buyer"), isBuyer ? deal.farmer : deal.buyer],
                [t("deal.cropLotId"), `${deal.crop} - ${deal.lotId}`],
                [t("common.mandi"), deal.marketName],
                [t("common.quantity"), `${number(currentQuantity)} ${t("common.quintal")}`],
                [t("deal.qualityGrade"), deal.grade],
                [["AGREED", "PAYMENT_PENDING", "PAYMENT_SENT", "COMPLETED"].includes(deal.status) ? t("deal.agreedRate") : t("deal.currentPrice"), `${money(currentPrice)} / Qt`],
                [t("deal.totalAmount"), money(total)],
                [t("deal.askingPrice"), `${money(deal.counterOffer || deal.agreedPrice)} / Qt`],
                [t("common.date"), deal.date],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl bg-[#F4EFE4] p-3.5 border border-[#D8CDBB]">
                  <span className="text-xs text-[#765536]">{label}</span>
                  <b className="block text-sm text-[#33291F] mt-0.5">{val}</b>
                </div>
              ))}
            </div>
          </div>

          <FairPriceInsight
            currentOffer={currentPrice}
            insight={priceInsight}
            loading={priceInsightLoading}
            error={priceInsightError}
          />

          <div className="rounded-xl border border-[#D8CDBB] p-5 bg-[#F4EFE4]">
            <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#33291F]">
              <Handshake size={19} className="text-[#B96832]" />
              {t("deal.negotiation")}
            </h3>
            <div className="mt-4 space-y-3">
              {offers.length === 0 ? (
                <p className="text-sm text-[#765536]">{t("deal.noOffers")}</p>
              ) : (
                offers.map((offer) => (
                  <div key={offer.id} className={`rounded-md border p-3 text-sm ${offer.senderRole === "Buyer" ? "border-[#B96832]/30 bg-white" : "border-[#555633]/30 bg-[#E9E1D2]"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-[#33291F]">{roleLabel(offer.senderRole)}</p>
                      <span className="rounded-full bg-[#F4EFE4] px-2.5 py-1 text-[11px] font-bold text-[#765536]">{statusLabel(offer.status)}</span>
                    </div>
                    <p className="mt-1 font-bold">{t("deal.offerLine", { price: money(offer.pricePerUnit), quantity: number(offer.quantity) })}</p>
                    {offer.message && <p className="mt-1 text-xs text-[#765536]">{offer.message}</p>}
                  </div>
                ))
              )}
            </div>

            {!["AGREED", "PAYMENT_PENDING", "PAYMENT_SENT", "COMPLETED", "REJECTED", "CANCELLED"].includes(deal.status) && (
              <form onSubmit={handleOffer} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr]">
                <label>
                  <span className="mb-1 block text-xs font-bold text-[#765536]">{t("deal.quantityQt")}</span>
                  <input name="quantity" required type="number" min="1" step="0.01" defaultValue={currentQuantity} className="w-full rounded-md border border-[#D8CDBB] px-3 py-2 text-sm outline-none focus:border-[#B96832]" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-[#765536]">{t("deal.pricePerQt")}</span>
                  <input name="pricePerUnit" required type="number" min="1" step="0.01" defaultValue={currentPrice} className="w-full rounded-md border border-[#D8CDBB] px-3 py-2 text-sm outline-none focus:border-[#B96832]" />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-bold text-[#765536]">{t("deal.message")}</span>
                  <textarea name="offerMessage" className="min-h-20 w-full rounded-md border border-[#D8CDBB] px-3 py-2 text-sm outline-none focus:border-[#B96832]" placeholder={t("deal.offerMessagePlaceholder")} />
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <button disabled={acting} className="inline-flex items-center gap-2 rounded-md bg-[#B96832] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">
                    <Send size={15} /> {latestOffer ? t("deal.sendCounterOffer") : t("deal.sendOffer")}
                  </button>
                  {canRespondToLatest && (
                    <>
                      <button type="button" disabled={acting} onClick={() => handleDealAction("accept")} className="inline-flex items-center gap-2 rounded-md bg-[#555633] px-4 py-2.5 text-xs font-bold text-[#F4EFE4] disabled:opacity-60">
                        <CheckCircle2 size={15} /> {t("deal.acceptOffer")}
                      </button>
                      <button type="button" disabled={acting} onClick={() => handleDealAction("reject")} className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 disabled:opacity-60">
                        <XCircle size={15} /> {t("deal.rejectOffer")}
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="rounded-xl border border-[#D8CDBB] p-5 bg-white">
            <h3 className="text-lg font-extrabold text-[#33291F]">{t("deal.dealStatus")}</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {["NEGOTIATING", "AGREED", "PAYMENT_SENT", "COMPLETED"].map((step) => (
                <div key={step} className={`rounded-md border p-3 text-xs font-bold ${deal.status === step || (step === "NEGOTIATING" && deal.status === "COUNTER_OFFER") ? "border-[#B96832] bg-[#E9E1D2] text-[#B96832]" : "border-[#D8CDBB] bg-[#F4EFE4] text-[#765536]"}`}>
                  {statusLabel(step)}
                </div>
              ))}
            </div>
            {isBuyer && (deal.status === "AGREED" || deal.status === "PAYMENT_PENDING") && (
              <button disabled={acting} onClick={() => handleDealAction("payment-sent")} className="mt-4 rounded-md bg-[#555633] px-4 py-2.5 text-xs font-bold text-[#F4EFE4] disabled:opacity-60">
                {t("deal.markPaymentSent")}
              </button>
            )}
            {isBuyer && deal.status === "PAYMENT_SENT" && (
              <p className="mt-4 rounded-md bg-[#F4EFE4] p-3 text-sm font-bold text-[#765536]">{t("deal.paymentSentWaiting")}</p>
            )}
            {isFarmer && deal.status === "PAYMENT_SENT" && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="rounded-md bg-[#F4EFE4] p-3 text-sm font-bold text-[#765536]">{t("deal.paymentSentConfirm")}</p>
                <button disabled={acting} onClick={() => handleDealAction("payment-received")} className="rounded-md bg-[#555633] px-4 py-2.5 text-xs font-bold text-[#F4EFE4] disabled:opacity-60">
                  {t("deal.markPaymentReceived")}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#D8CDBB] bg-white p-6 shadow-soft flex flex-col justify-between h-[550px]">
          <div>
            <div className="flex items-center gap-2 border-b border-[#D8CDBB] pb-3">
              <MessageSquare className="text-[#B96832]" size={20} />
              <h2 className="text-xl font-black text-[#33291F]">{t("deal.privateChat")}</h2>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {messages.map((msg) => (
                <div key={msg.id} className={`rounded-xl border p-3 text-xs ${msg.senderId === user?.id ? "border-[#B96832]/30 bg-[#E9E1D2]" : "border-[#D8CDBB] bg-[#F4EFE4]"}`}>
                  <div className="flex justify-between items-center mb-1 font-bold text-[#B96832]">
                    <span>{msg.sender}</span>
                    <span className="text-[10px] text-[#765536]">{msg.time}</span>
                  </div>
                  <p className="text-[#33291F]/80 text-xs leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
            <input
              name="message"
              required
              placeholder={t("deal.chatPlaceholder")}
              className="min-w-0 flex-1 rounded-xl border border-[#D8CDBB] px-3.5 py-3 text-xs outline-none focus:border-[#B96832]"
            />
            <button
              disabled={sending}
              type="submit"
              className="rounded-xl bg-[#B96832] px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#9D5529]"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export function Transactions() {
  const { user } = useAuth();
  const { t, statusLabel, paymentLabel } = useI18n();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeFilter, setActiveFilter] = useState<DealFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeals()
      .then(setDeals)
      .catch((err: any) => {
        console.error(err);
        setError(err.message || t("transactions.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, []);

  const completed = deals.filter((d) => d.status === "COMPLETED").length;
  const active = deals.filter((d) => isActiveDeal(d.status)).length;
  const rejected = deals.filter((d) => isRejectedDeal(d.status)).length;
  const filteredDeals = deals.filter((deal) => matchesDealFilter(deal, activeFilter));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#33291F]">{t("transactions.title")}</h1>
        <p className="mt-1 text-sm text-[#765536]">
          {t("transactions.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t("transactions.totalDeals")} value={String(deals.length)} icon={Handshake} />
        <StatCard label={t("dashboard.activeDeals")} value={String(active)} icon={RefreshCcw} />
        <StatCard label={t("transactions.completedDeals")} value={String(completed)} icon={CheckCircle2} />
      </div>

      <Section title={t("transactions.history")}>
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ["All", deals.length, t("common.all")],
            ["Active", active, t("common.active")],
            ["Completed", completed, t("common.completed")],
            ["Rejected", rejected, t("common.rejected")],
          ].map(([filter, count, label]) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter as DealFilter)}
              className={`rounded-md border px-3.5 py-2 text-xs font-bold transition ${
                activeFilter === filter
                  ? "border-[#B96832] bg-[#B96832] text-white"
                  : "border-[#D8CDBB] bg-white text-[#765536] hover:border-[#B96832]/60"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        {loading ? (
          <div className="grid min-h-[240px] place-items-center rounded-2xl border border-[#D8CDBB] bg-white shadow-soft">
            <div className="flex items-center gap-3 text-[#B96832] font-semibold">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#B96832] border-t-transparent" />
              {t("transactions.loading")}
            </div>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="rounded-2xl border border-[#D8CDBB] bg-white p-8 text-center shadow-soft">
            <p className="text-sm font-bold text-[#33291F]">{t("transactions.none", { filter: activeFilter === "All" ? t("common.all").toLowerCase() : activeFilter.toLowerCase() })}</p>
            <p className="mt-1 text-xs text-[#765536]">{t("transactions.noneHint")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#D8CDBB] bg-white shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F4EFE4] font-bold text-[#765536]">
                <tr>
                  <th className="p-4">{t("deal.room")}</th>
                  <th className="p-4">{user?.role === "Buyer" ? t("common.farmer") : t("common.buyer")}</th>
                  <th className="p-4">{t("common.produce")}</th>
                  <th className="p-4">{t("common.quantity")}</th>
                  <th className="p-4">{t("common.price")}</th>
                  <th className="p-4">{t("common.status")}</th>
                  <th className="p-4">{t("common.payment")}</th>
                  <th className="p-4">{t("common.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CDBB]">
                {filteredDeals.map((deal) => {
                  const unitPrice = getDealPrice(deal);
                  const total = unitPrice * deal.quantityQt;
                  const otherParty = user?.role === "Buyer" ? deal.farmer : deal.buyer;

                  return (
                    <tr key={deal.id} className="transition hover:bg-[#F4EFE4]">
                      <td className="p-4 font-black">
                        <Link to={`/deal-room/${deal.id}`} className="text-[#B96832] hover:underline">
                          {deal.id}
                        </Link>
                        <span className="mt-1 block text-[11px] font-semibold text-[#765536]">{deal.date}</span>
                      </td>
                      <td className="p-4 font-semibold text-[#33291F]">
                        {otherParty}
                        <span className="mt-1 block text-[11px] font-medium text-[#765536]">
                          {user?.role === "Buyer" ? t("common.farmer") : t("common.buyer")}
                        </span>
                      </td>
                      <td className="p-4 text-[#765536]">
                        <b className="block text-[#33291F]">{deal.crop}</b>
                        <span className="text-xs">{deal.grade} - {deal.lotId}</span>
                        {deal.marketName && <span className="mt-1 block text-xs">{deal.marketName}</span>}
                      </td>
                      <td className="p-4 font-semibold text-[#33291F]">{number(deal.quantityQt)} Qt</td>
                      <td className="p-4 text-[#33291F]">
                        <b className="block">{money(unitPrice)} / Qt</b>
                        <span className="text-xs text-[#765536]">{money(total)} {t("common.total")}</span>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${statusClass(deal.status)}`}>
                          {statusLabel(deal.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${paymentClass(deal.paymentStatus)}`}>
                          {paymentLabel(deal.paymentStatus)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/deal-room/${deal.id}`} className="inline-flex items-center gap-1 rounded-md bg-[#B96832] px-3 py-2 text-xs font-bold text-white hover:bg-[#9D5529]">
                            <Handshake size={14} /> {t("transactions.openDeal")}
                          </Link>
                          {deal.status === "COMPLETED" ? (
                            <Link to={`/bill/${deal.id}`} className="inline-flex items-center gap-1 rounded-md border border-[#D8CDBB] px-3 py-2 text-xs font-bold text-[#765536] hover:border-[#B96832]/60">
                              <FileText size={14} /> {t("transactions.bill")}
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-[#D8CDBB] bg-[#F4EFE4] px-3 py-2 text-xs font-bold text-[#765536]">
                              <AlertCircle size={14} /> {statusLabel(deal.status)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function FairPriceInsight({ currentOffer, insight, loading, error }: { currentOffer: number; insight: MLPredictionResponse | null; loading: boolean; error: string | null }) {
  const predictedPoint = insight?.predictions[0];
  const predictedPrice = predictedPoint?.predictedPrice;
  const difference = predictedPrice === undefined ? null : currentOffer - predictedPrice;

  return (
    <div className="rounded-xl border border-[#D8CDBB] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-[#33291F]">
            <BarChart3 size={19} className="text-[#B96832]" />
            AI Fair Price Insight
          </h3>
          <p className="mt-1 text-xs font-semibold text-[#765536]">Informational only. Offers remain under buyer and farmer control.</p>
        </div>
        {loading && <span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#765536]">Loading...</span>}
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <InsightMetric label="Current Market Price" value={insight ? `${money(insight.currentPrice)}/Qt` : loading ? "Checking..." : "-"} />
          <InsightMetric label="AI Predicted Price" value={predictedPrice !== undefined ? `${money(predictedPrice)}/Qt` : loading ? "Checking..." : "-"} />
          <InsightMetric label="Suggested Fair Price Range" value={predictedPoint ? `${money(predictedPoint.low)} - ${money(predictedPoint.high)}` : loading ? "Checking..." : "-"} />
          <InsightMetric label="Current Deal Offer" value={`${money(currentOffer)}/Qt`} />
          <InsightMetric
            label="Offer vs Predicted"
            value={difference === null ? "-" : `${difference >= 0 ? "+" : ""}${money(difference)}`}
            tone={difference === null ? undefined : Math.abs(difference) < 1 ? "neutral" : difference > 0 ? "high" : "low"}
          />
        </div>
      )}
    </div>
  );
}

function InsightMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "high" | "low" }) {
  const toneClass =
    tone === "high"
      ? "text-[#555633]"
      : tone === "low"
        ? "text-[#B96832]"
        : "text-[#33291F]";

  return (
    <div className="rounded-md border border-[#D8CDBB] bg-[#F4EFE4] p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#765536]">{label}</p>
      <p className={`mt-1 text-sm font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

export function Bill() {
  const { id = "DL-9002" } = useParams();
  const { t, statusLabel, paymentLabel } = useI18n();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDealById(id)
      .then(setDeal)
      .catch((err: any) => setError(err.message || t("deal.notFound")));
  }, [id]);

  if (!deal) {
    return <div className="py-12 text-center text-xs text-[#765536]">{error || t("bill.loading")}</div>;
  }

  const total = deal.agreedPrice * deal.quantityQt;
  const isCompleted = deal.status === "COMPLETED";
  const issuedAt = deal.updatedAt
    ? new Date(deal.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : deal.date;
  const marketLocation = formatMarketLocation(deal);
  const buyerPaymentStatus = deal.paymentGiven ? "Given" : paymentLabel("PENDING");
  const sellerPaymentStatus = deal.paymentReceived ? "Received" : paymentLabel("PENDING");
  const paymentReference = getPaymentReference(deal);

  function printBill() {
    window.print();
  }

  async function downloadPdf() {
    if (!isCompleted) return;
    const billElement = document.getElementById("digital-bill");
    if (!billElement) return;
    const blob = await createDigitalBillPdf(billElement);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deal!.id}-digital-bill.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  if (!isCompleted) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#D8CDBB] bg-white p-8 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D8CDBB] pb-5">
          <FairTradeLogo size="sm" clickable={false} />
          <span className={`rounded-xl px-4 py-2 text-xs font-black ${statusClass(deal.status)}`}>
            {statusLabel(deal.status)}
          </span>
        </div>
        <div className="mt-6 rounded-xl border border-[#D8CDBB] bg-[#F4EFE4] p-5">
          <h1 className="flex items-center gap-2 text-2xl font-black text-[#33291F]">
            <AlertCircle size={22} className="text-[#B96832]" />
            {t("bill.notReadyTitle")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#765536]">
            {t("bill.notReadyDetail", { status: statusLabel(deal.status) })}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <BillRow label={t("bill.reference")} value={deal.id} />
            <BillRow label={t("deal.dealStatus")} value={statusLabel(deal.status)} />
            <BillRow label={t("deal.paymentStatus")} value={paymentLabel(deal.paymentStatus)} />
            <BillRow label={t("deal.cropAndLot")} value={`${deal.crop} - ${deal.lotId}`} />
          </div>
          <Link to={`/deal-room/${deal.id}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#B96832] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#9D5529]">
            <HandCoins size={17} /> {t("transactions.openDeal")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Controls */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D8CDBB] bg-white p-4 shadow-soft">
        <FairTradeLogo size="sm" clickable={false} />
        <div className="flex gap-2">
          <button
            onClick={printBill}
            className="inline-flex items-center gap-2 rounded-xl border border-[#555633] px-4 py-2.5 text-xs font-bold text-[#555633] hover:bg-[#E9E1D2]"
          >
            <Printer size={16} /> {t("bill.printInvoice")}
          </button>
          <button
            onClick={downloadPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B96832] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#9D5529]"
          >
            <Download size={16} /> {t("bill.downloadPdf")}
          </button>
        </div>
      </div>

      <div id="digital-bill" className="a4-bill overflow-hidden rounded-lg border-2 border-[#555633] bg-white shadow-soft">
        <header className="grid border-b-2 border-[#555633] md:grid-cols-[1fr_1.35fr]">
          <div className="border-b-2 border-[#555633] p-5 md:border-b-0 md:border-r-2">
            <FairTradeLogo size="sm" clickable={false} />
            <h1 className="mt-6 text-3xl font-black text-[#33291F]">Fair Trade Log</h1>
          </div>
          <div className="grid text-sm font-bold text-[#33291F] sm:grid-cols-2">
            <LogCell label="Date" value={issuedAt} />
            <LogCell label="Mandi Name / Where the deal is made" value={marketLocation} />
            <LogCell label="Buyer ID" value={deal.buyerId} />
            <LogCell label="Seller ID" value={deal.farmerId} />
            <LogCell label="Shop / Deal location" value={marketLocation} />
            <LogCell label="Deal ID" value={deal.id} />
          </div>
        </header>

        <main className="space-y-7 p-5 sm:p-7">
          <section className="rounded-md border-2 border-[#555633]">
            <div className="grid sm:grid-cols-2">
              <LogCell label="Buyer ID" value={deal.buyerId} large />
              <LogCell label="Buyer Name" value={deal.buyer} large />
              <LogCell label="Seller ID" value={deal.farmerId} large />
              <LogCell label="Seller Name" value={deal.farmer} large />
            </div>
          </section>

          <section className="rounded-md border-2 border-[#555633] bg-[#F4EFE4]/50 p-5">
            <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
              <LineField label="Crop (Lot ID)" value={`${deal.crop} (${deal.lotId})`} />
              <LineField label="Start Price" value={`${money(deal.offer)} / ${t("common.quintal")}`} />
              <LineField label="Negotiation" value={`${money(deal.counterOffer)} / ${t("common.quintal")}`} />
              <LineField label="Final Price" value={`${money(deal.agreedPrice)} / ${t("common.quintal")}`} />
            </div>
          </section>

          <section className="rounded-md border-2 border-[#555633] p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <LineField label="Transaction Mode" value={deal.transactionMode} />
                <LineField label="FairTrade Transactions" value={deal.transactionMode === "Use FairTrade" ? statusLabel(deal.status) : deal.transactionMode} />
                <LineField label={t("common.totalAmount")} value={money(total)} strong />
              </div>
              <div className="rounded-md border border-[#D8CDBB] bg-[#F4EFE4] p-4">
                <h2 className="text-sm font-black uppercase text-[#33291F]">Payment Status</h2>
                <div className="mt-4 space-y-3 text-sm font-bold text-[#33291F]">
                  <StatusLine party="Seller" status={sellerPaymentStatus} />
                  <StatusLine party="Buyer" status={buyerPaymentStatus} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-md border-2 border-[#555633] bg-[#E9E1D2] p-5">
            <LineField label="UPI ID / Transaction ID" value={paymentReference} />
          </section>

          <p className="text-xs font-semibold leading-5 text-[#765536]">
            <b className="text-[#33291F]">{t("bill.completionStatus")}:</b> {statusLabel(deal.status)}. {t("bill.actualDataNote")}
          </p>
        </main>
      </div>
    </div>
  );
}

function formatMarketLocation(deal: Deal) {
  return [deal.marketName, deal.marketCity, deal.marketState].filter(Boolean).join(", ") || "-";
}

function getPaymentReference(deal: Deal) {
  return deal.paymentGiven || deal.paymentReceived ? "Not recorded in payment data" : "-";
}

async function createDigitalBillPdf(sourceElement: HTMLElement) {
  const jpegDataUrl = await renderBillElementToJpeg(sourceElement);
  return createA4ImagePdf(jpegDataUrl);
}

async function renderBillElementToJpeg(sourceElement: HTMLElement) {
  await document.fonts?.ready;

  const rect = sourceElement.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(sourceElement.scrollHeight || rect.height);
  const clone = sourceElement.cloneNode(true) as HTMLElement;

  await inlineImageSources(clone);
  inlineComputedStyles(sourceElement, clone);

  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = "0";
  clone.style.boxSizing = "border-box";
  clone.style.boxShadow = "none";

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject width="100%" height="100%">
        ${serialized}
      </foreignObject>
    </svg>
  `;
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const image = await loadImage(svgUrl);
    const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create PDF canvas context.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.95);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

async function inlineImageSources(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(images.map(async (image) => {
    const source = image.getAttribute("src");
    if (!source || source.startsWith("data:")) return;

    const response = await fetch(source);
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    image.setAttribute("src", dataUrl);
  }));
}

function inlineComputedStyles(source: Element, clone: Element) {
  if (source instanceof HTMLElement && clone instanceof HTMLElement) {
    const computedStyle = window.getComputedStyle(source);
    clone.setAttribute("style", computedStyleToText(computedStyle));
  }

  const sourceChildren = Array.from(source.children);
  const cloneChildren = Array.from(clone.children);
  sourceChildren.forEach((child, index) => {
    const childClone = cloneChildren[index];
    if (childClone) inlineComputedStyles(child, childClone);
  });
}

function computedStyleToText(style: CSSStyleDeclaration) {
  return Array.from(style)
    .map((property) => `${property}:${style.getPropertyValue(property)};`)
    .join("");
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to render Digital Bill for PDF download."));
    image.src = src;
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Unable to embed bill image."));
    reader.readAsDataURL(blob);
  });
}

function createA4ImagePdf(jpegDataUrl: string) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 24;
  const jpegBytes = dataUrlToBytes(jpegDataUrl);
  const { width: imageWidth, height: imageHeight } = readJpegSize(jpegBytes);
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;
  const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const x = (pageWidth - drawWidth) / 2;
  const y = pageHeight - margin - drawHeight;
  const content = asciiBytes(`q\n${formatPdfNumber(drawWidth)} 0 0 ${formatPdfNumber(drawHeight)} ${formatPdfNumber(x)} ${formatPdfNumber(y)} cm\n/Im1 Do\nQ\n`);
  const objects = [
    asciiBytes("<< /Type /Catalog /Pages 2 0 R >>"),
    asciiBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    asciiBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>`),
    streamObject(content),
    streamObject(jpegBytes, `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>`),
  ];

  return new Blob([buildPdf(objects)], { type: "application/pdf" });
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function readJpegSize(bytes: Uint8Array) {
  for (let index = 2; index < bytes.length; index += 1) {
    if (bytes[index] !== 0xff) continue;

    const marker = bytes[index + 1];
    const length = (bytes[index + 2] << 8) + bytes[index + 3];
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: (bytes[index + 5] << 8) + bytes[index + 6],
        width: (bytes[index + 7] << 8) + bytes[index + 8],
      };
    }

    index += 1 + length;
  }

  throw new Error("Unable to read captured bill image size.");
}

function formatPdfNumber(value: number) {
  return Number(value.toFixed(2));
}

function asciiBytes(value: string) {
  return new TextEncoder().encode(value);
}

function streamObject(stream: Uint8Array, dictionary?: string) {
  const header = dictionary || `<< /Length ${stream.length} >>`;
  return concatBytes([
    asciiBytes(`${header}\nstream\n`),
    stream,
    asciiBytes("\nendstream"),
  ]);
}

function buildPdf(objects: Uint8Array[]) {
  const chunks: Uint8Array[] = [asciiBytes("%PDF-1.4\n")];
  const offsets: number[] = [0];
  let position = chunks[0].length;

  objects.forEach((object, index) => {
    offsets[index + 1] = position;
    const prefix = asciiBytes(`${index + 1} 0 obj\n`);
    const suffix = asciiBytes("\nendobj\n");
    chunks.push(prefix, object, suffix);
    position += prefix.length + object.length + suffix.length;
  });

  const xrefStart = position;
  let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    trailer += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  trailer += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  chunks.push(asciiBytes(trailer));

  return concatBytes(chunks);
}

function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

function LogCell({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="min-h-20 border-b border-r border-[#D8CDBB] p-3 last:border-r-0 sm:[&:nth-child(even)]:border-r-0">
      <p className="text-[11px] font-black uppercase text-[#765536]">{label}</p>
      <p className={`mt-2 break-words font-extrabold text-[#33291F] ${large ? "text-base" : "text-sm"}`}>{value || "-"}</p>
    </div>
  );
}

function LineField({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="grid items-end gap-3 sm:grid-cols-[170px_1fr]">
      <p className={`font-black text-[#33291F] ${strong ? "text-lg" : "text-base"}`}>{label}</p>
      <p className={`min-h-9 border-b-2 border-[#555633] pb-1 font-bold text-[#33291F] ${strong ? "text-xl" : "text-sm"}`}>{value || "-"}</p>
    </div>
  );
}

function StatusLine({ party, status }: { party: string; status: string }) {
  return (
    <div className="grid grid-cols-[88px_24px_1fr] items-center gap-2">
      <span>{party}</span>
      <span className="text-center text-[#B96832]">-&gt;</span>
      <span>{status}</span>
    </div>
  );
}

function BillRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border border-[#D8CDBB] ${strong ? "bg-[#E9E1D2]" : "bg-[#F4EFE4]"}`}>
      <p className="text-xs text-[#765536]">{label}</p>
      <p className={`mt-1 ${strong ? "text-2xl font-black text-[#33291F]" : "text-sm font-bold text-[#33291F]"}`}>{value}</p>
    </div>
  );
}

type DealFilter = "All" | "Active" | "Completed" | "Rejected";

function isActiveDeal(status: Deal["status"]) {
  return !["COMPLETED", "REJECTED", "CANCELLED"].includes(status);
}

function isRejectedDeal(status: Deal["status"]) {
  return status === "REJECTED" || status === "CANCELLED";
}

function matchesDealFilter(deal: Deal, filter: DealFilter) {
  if (filter === "Completed") return deal.status === "COMPLETED";
  if (filter === "Rejected") return isRejectedDeal(deal.status);
  if (filter === "Active") return isActiveDeal(deal.status);
  return true;
}

function getDealPrice(deal: Deal) {
  return deal.agreedPrice || deal.counterOffer || deal.offer;
}

function statusClass(status: string) {
  if (status === "COMPLETED") return "bg-cyan-50 text-cyan-700";
  if (status === "REJECTED" || status === "CANCELLED") return "bg-red-50 text-red-700";
  if (status === "PAYMENT_SENT" || status === "PAYMENT_PENDING") return "bg-[#555633] text-[#F4EFE4]";
  return "bg-[#E9E1D2] text-[#33291F]";
}

function paymentClass(status: Deal["paymentStatus"]) {
  if (status === "RECEIVED") return "bg-cyan-50 text-cyan-700";
  if (status === "SENT") return "bg-[#555633] text-[#F4EFE4]";
  return "bg-[#E9E1D2] text-[#33291F]";
}
