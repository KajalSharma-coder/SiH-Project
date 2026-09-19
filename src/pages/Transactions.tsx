import { CheckCircle2, Download, FileText, Handshake, IndianRupee, MessageSquare, Printer, RefreshCcw, Send, XCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Section, StatCard } from "../components/Cards";
import { FairTradeLogo } from "../components/Logo";
import { acceptDealOffer, getChatMessages, getDealById, getDealOffers, getDeals, markPaymentReceived, markPaymentSent, rejectDealOffer, sendChatMessage, sendCounterOffer, sendDealOffer } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { ChatMessage, Deal, DealOffer } from "../types";
import { money, number } from "../utils/format";

export function DealRoom() {
  const { id = "DL-9001" } = useParams();
  const { user } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [offers, setOffers] = useState<DealOffer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(err.message || "Unable to load deal room.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="grid min-h-[400px] place-items-center rounded-2xl bg-white p-8 shadow-soft">
        <div className="flex items-center gap-3 text-[#B96832] font-semibold">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#B96832] border-t-transparent" />
          Loading Deal Room...
        </div>
      </div>
    );
  }

  if (!deal) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error || "Deal not found."}</div>;
  }

  const isBuyer = user?.id === deal.buyerId;
  const isFarmer = user?.id === deal.farmerId;
  const latestOffer = offers[offers.length - 1];
  const canRespondToLatest = latestOffer && latestOffer.senderId !== user?.id && !["COMPLETED", "REJECTED", "CANCELLED"].includes(deal.status);
  const currentPrice = latestOffer?.pricePerUnit || deal.agreedPrice || deal.offer || deal.counterOffer;
  const currentQuantity = latestOffer?.quantity || deal.quantityQt;
  const total = currentPrice * currentQuantity;

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
      setError(err.message || "Failed to send offer.");
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
      setError(err.message || "Action failed.");
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
            <Handshake size={16} /> {isBuyer ? "Buyer Deal Room" : isFarmer ? "Farmer Deal Room" : "Deal Room"}
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#33291F]">Deal #{deal.id}</h1>
          <p className="text-sm text-[#765536] mt-0.5">
            Negotiate privately, confirm payment step by step, and keep the deal record in one place.
          </p>
        </div>
        <Link
          to={`/bill/${deal.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#B96832] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#9D5529]"
        >
          <FileText size={18} /> View Digital Bill
        </Link>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={["AGREED", "PAYMENT_PENDING", "PAYMENT_SENT", "COMPLETED"].includes(deal.status) ? "Agreed Rate" : "Current Offer"} value={`${money(currentPrice)}/Qt`} icon={IndianRupee} />
        <StatCard label="Total Amount" value={money(total)} icon={IndianRupee} />
        <StatCard label="Deal Status" value={deal.status.replaceAll("_", " ")} icon={RefreshCcw} />
        <StatCard label="Payment Status" value={deal.paymentStatus} icon={IndianRupee} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-[#D8CDBB] bg-white p-6 shadow-soft space-y-6">
          <div>
            <h2 className="text-xl font-black text-[#33291F]">Deal Summary</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                [isBuyer ? "Farmer" : "Buyer", isBuyer ? deal.farmer : deal.buyer],
                ["Crop / Lot ID", `${deal.crop} - ${deal.lotId}`],
                ["Quantity", `${number(currentQuantity)} Quintals`],
                ["Quality Grade", deal.grade],
                [["AGREED", "PAYMENT_PENDING", "PAYMENT_SENT", "COMPLETED"].includes(deal.status) ? "Agreed Rate" : "Current Price", `${money(currentPrice)} / Qt`],
                ["Total Amount", money(total)],
                ["Asking Price", `${money(deal.counterOffer || deal.agreedPrice)} / Qt`],
                ["Date", deal.date],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl bg-[#F4EFE4] p-3.5 border border-[#D8CDBB]">
                  <span className="text-xs text-[#765536]">{label}</span>
                  <b className="block text-sm text-[#33291F] mt-0.5">{val}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#D8CDBB] p-5 bg-[#F4EFE4]">
            <h3 className="text-lg font-extrabold text-[#33291F]">Negotiation</h3>
            <div className="mt-4 space-y-3">
              {offers.length === 0 ? (
                <p className="text-sm text-[#765536]">No offers yet.</p>
              ) : (
                offers.map((offer) => (
                  <div key={offer.id} className={`rounded-md border p-3 text-sm ${offer.senderRole === "Buyer" ? "border-[#B96832]/30 bg-white" : "border-[#555633]/30 bg-[#E9E1D2]"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-[#33291F]">{offer.senderRole}</p>
                      <span className="rounded-full bg-[#F4EFE4] px-2.5 py-1 text-[11px] font-bold text-[#765536]">{offer.status}</span>
                    </div>
                    <p className="mt-1 font-bold">{money(offer.pricePerUnit)}/qt for {number(offer.quantity)} qt</p>
                    {offer.message && <p className="mt-1 text-xs text-[#765536]">{offer.message}</p>}
                  </div>
                ))
              )}
            </div>

            {!["AGREED", "PAYMENT_PENDING", "PAYMENT_SENT", "COMPLETED", "REJECTED", "CANCELLED"].includes(deal.status) && (
              <form onSubmit={handleOffer} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr]">
                <label>
                  <span className="mb-1 block text-xs font-bold text-[#765536]">Quantity (qt)</span>
                  <input name="quantity" required type="number" min="1" step="0.01" defaultValue={currentQuantity} className="w-full rounded-md border border-[#D8CDBB] px-3 py-2 text-sm outline-none focus:border-[#B96832]" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-[#765536]">Price per qt</span>
                  <input name="pricePerUnit" required type="number" min="1" step="0.01" defaultValue={currentPrice} className="w-full rounded-md border border-[#D8CDBB] px-3 py-2 text-sm outline-none focus:border-[#B96832]" />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-bold text-[#765536]">Message</span>
                  <textarea name="offerMessage" className="min-h-20 w-full rounded-md border border-[#D8CDBB] px-3 py-2 text-sm outline-none focus:border-[#B96832]" placeholder="Add a note with your offer" />
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <button disabled={acting} className="inline-flex items-center gap-2 rounded-md bg-[#B96832] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">
                    <Send size={15} /> {latestOffer ? "Send Counter Offer" : "Send Offer"}
                  </button>
                  {canRespondToLatest && (
                    <>
                      <button type="button" disabled={acting} onClick={() => handleDealAction("accept")} className="inline-flex items-center gap-2 rounded-md bg-[#555633] px-4 py-2.5 text-xs font-bold text-[#F4EFE4] disabled:opacity-60">
                        <CheckCircle2 size={15} /> Accept Offer
                      </button>
                      <button type="button" disabled={acting} onClick={() => handleDealAction("reject")} className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 disabled:opacity-60">
                        <XCircle size={15} /> Reject Offer
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="rounded-xl border border-[#D8CDBB] p-5 bg-white">
            <h3 className="text-lg font-extrabold text-[#33291F]">Deal Status</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {["NEGOTIATING", "AGREED", "PAYMENT_SENT", "COMPLETED"].map((step) => (
                <div key={step} className={`rounded-md border p-3 text-xs font-bold ${deal.status === step || (step === "NEGOTIATING" && deal.status === "COUNTER_OFFER") ? "border-[#B96832] bg-[#E9E1D2] text-[#B96832]" : "border-[#D8CDBB] bg-[#F4EFE4] text-[#765536]"}`}>
                  {step.replaceAll("_", " ")}
                </div>
              ))}
            </div>
            {isBuyer && (deal.status === "AGREED" || deal.status === "PAYMENT_PENDING") && (
              <button disabled={acting} onClick={() => handleDealAction("payment-sent")} className="mt-4 rounded-md bg-[#555633] px-4 py-2.5 text-xs font-bold text-[#F4EFE4] disabled:opacity-60">
                Mark Payment Sent
              </button>
            )}
            {isBuyer && deal.status === "PAYMENT_SENT" && (
              <p className="mt-4 rounded-md bg-[#F4EFE4] p-3 text-sm font-bold text-[#765536]">Payment Sent — Waiting for Farmer Confirmation</p>
            )}
            {isFarmer && deal.status === "PAYMENT_SENT" && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="rounded-md bg-[#F4EFE4] p-3 text-sm font-bold text-[#765536]">Payment Sent — Confirm Payment Received</p>
                <button disabled={acting} onClick={() => handleDealAction("payment-received")} className="rounded-md bg-[#555633] px-4 py-2.5 text-xs font-bold text-[#F4EFE4] disabled:opacity-60">
                  Mark Payment Received
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#D8CDBB] bg-white p-6 shadow-soft flex flex-col justify-between h-[550px]">
          <div>
            <div className="flex items-center gap-2 border-b border-[#D8CDBB] pb-3">
              <MessageSquare className="text-[#B96832]" size={20} />
              <h2 className="text-xl font-black text-[#33291F]">Private Chat</h2>
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
              placeholder="Type message to negotiate..."
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
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeFilter, setActiveFilter] = useState<DealFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeals()
      .then(setDeals)
      .catch((err: any) => {
        console.error(err);
        setError(err.message || "Unable to load deals.");
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
        <h1 className="text-3xl font-black tracking-tight text-[#33291F]">Deal Room</h1>
        <p className="mt-1 text-sm text-[#765536]">
          Your private deal history, negotiation rooms, payment status and digital bills.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Deals" value={String(deals.length)} icon={Handshake} />
        <StatCard label="Active Deals" value={String(active)} icon={RefreshCcw} />
        <StatCard label="Completed Deals" value={String(completed)} icon={CheckCircle2} />
      </div>

      <Section title="Deal History">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ["All", deals.length],
            ["Active", active],
            ["Completed", completed],
            ["Rejected", rejected],
          ].map(([filter, count]) => (
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
              {filter} ({count})
            </button>
          ))}
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        {loading ? (
          <div className="grid min-h-[240px] place-items-center rounded-2xl border border-[#D8CDBB] bg-white shadow-soft">
            <div className="flex items-center gap-3 text-[#B96832] font-semibold">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#B96832] border-t-transparent" />
              Loading deals...
            </div>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="rounded-2xl border border-[#D8CDBB] bg-white p-8 text-center shadow-soft">
            <p className="text-sm font-bold text-[#33291F]">No {activeFilter.toLowerCase()} deals found.</p>
            <p className="mt-1 text-xs text-[#765536]">Deals you start or receive will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#D8CDBB] bg-white shadow-soft">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F4EFE4] font-bold text-[#765536]">
                <tr>
                  <th className="p-4">Deal</th>
                  <th className="p-4">{user?.role === "Buyer" ? "Farmer" : "Buyer"}</th>
                  <th className="p-4">Produce</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Action</th>
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
                          {user?.role === "Buyer" ? "Farmer" : "Buyer"}
                        </span>
                      </td>
                      <td className="p-4 text-[#765536]">
                        <b className="block text-[#33291F]">{deal.crop}</b>
                        <span className="text-xs">{deal.grade} - {deal.lotId}</span>
                      </td>
                      <td className="p-4 font-semibold text-[#33291F]">{number(deal.quantityQt)} Qt</td>
                      <td className="p-4 text-[#33291F]">
                        <b className="block">{money(unitPrice)} / Qt</b>
                        <span className="text-xs text-[#765536]">{money(total)} total</span>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${statusClass(deal.status)}`}>
                          {deal.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${paymentClass(deal.paymentStatus)}`}>
                          {deal.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/deal-room/${deal.id}`} className="inline-flex items-center gap-1 rounded-md bg-[#B96832] px-3 py-2 text-xs font-bold text-white hover:bg-[#9D5529]">
                            <Handshake size={14} /> Open Deal
                          </Link>
                          <Link to={`/bill/${deal.id}`} className="inline-flex items-center gap-1 rounded-md border border-[#D8CDBB] px-3 py-2 text-xs font-bold text-[#765536] hover:border-[#B96832]/60">
                            <FileText size={14} /> Bill
                          </Link>
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

export function Bill() {
  const { id = "DL-9002" } = useParams();
  const [deal, setDeal] = useState<Deal | null>(null);

  useEffect(() => {
    getDealById(id)
      .then(setDeal)
      .catch(() => getDeals().then((all) => setDeal(all[0])));
  }, [id]);

  if (!deal) {
    return <div className="py-12 text-center text-xs text-[#765536]">Loading Digital Bill...</div>;
  }

  const total = deal.agreedPrice * deal.quantityQt;

  function downloadBill() {
    const content = `FAIRTRADE DIGITAL BILL / INVOICE\n-----------------------------------\nBill Reference: ${deal!.id}\nDate: ${deal!.date}\nTransaction Option: ${deal!.transactionMode}\nFarmer (Seller): ${deal!.farmer}\nBuyer: ${deal!.buyer}\nCrop & Lot: ${deal!.crop} (${deal!.lotId})\nQuantity: ${deal!.quantityQt} Quintals\nQuality Grade: ${deal!.grade}\nAgreed Rate: ${deal!.agreedPrice} / Qt\nTotal Transaction Amount: ${total}\nPayment Status: ${deal!.status}\nPayment Given: ${deal!.paymentGiven ? "Confirmed" : "Pending"}\nPayment Received: ${deal!.paymentReceived ? "Confirmed" : "Pending"}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deal!.id}-fairtrade-bill.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl border border-[#D8CDBB] bg-white p-8 shadow-soft max-w-4xl mx-auto space-y-6">
      {/* Controls */}
      <div className="no-print flex flex-wrap justify-between items-center border-b border-[#D8CDBB] pb-4">
        <FairTradeLogo size="sm" clickable={false} />
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#555633] px-4 py-2.5 text-xs font-bold text-[#555633] hover:bg-[#E9E1D2]"
          >
            <Printer size={16} /> Print Invoice
          </button>
          <button
            onClick={downloadBill}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B96832] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#9D5529]"
          >
            <Download size={16} /> Download Bill TXT
          </button>
        </div>
      </div>

      {/* Bill Body */}
      <div>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-[#33291F] uppercase tracking-wider">Digital Bill / Transaction Record</p>
            <h1 className="text-3xl font-black text-[#33291F] mt-1">Invoice #{deal.id}</h1>
            <p className="text-xs text-[#765536] mt-1">
              Issued: {deal.date} | Mode: <b>{deal.transactionMode}</b>
            </p>
          </div>
          <span className={`rounded-xl px-4 py-2 text-xs font-black ${statusClass(deal.status)}`}>
            {deal.status.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <BillRow label="Seller (Farmer)" value={deal.farmer} />
          <BillRow label="Buyer" value={deal.buyer} />
          <BillRow label="Crop & Lot ID" value={`${deal.crop} - ${deal.lotId}`} />
          <BillRow label="Quality Grade" value={deal.grade} />
          <BillRow label="Quantity" value={`${number(deal.quantityQt)} Quintal`} />
          <BillRow label="Agreed Rate" value={`${money(deal.agreedPrice)} / Quintal`} />

          {deal.transactionMode === "Use FairTrade" && (
            <>
              <BillRow label="Payment Given Status" value={deal.paymentGiven ? "Confirmed" : "Pending"} />
              <BillRow label="Payment Received Status" value={deal.paymentReceived ? "Confirmed" : "Pending"} />
            </>
          )}

          <div className="md:col-span-2">
            <BillRow label="Total Transaction Amount" value={money(total)} strong />
          </div>
        </div>
      </div>
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
