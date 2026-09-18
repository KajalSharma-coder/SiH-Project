import { CheckCircle2, Download, FileText, Handshake, IndianRupee, MessageSquare, Printer, RefreshCcw, ShieldCheck, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Section, StatCard } from "../components/Cards";
import { FairTradeLogo } from "../components/Logo";
import { getChatMessages, getDealById, getDeals, sendChatMessage, updateDeal } from "../services/api";
import type { ChatMessage, Deal } from "../types";
import { money, number } from "../utils/format";

export function DealRoom() {
  const { id = "DL-9001" } = useParams();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [dData, mData] = await Promise.all([
          getDealById(id).catch(() => getDeals().then((all) => all[0])),
          getChatMessages(id).catch(() => []),
        ]);
        setDeal(dData);
        setMessages(mData);
      } catch (err) {
        console.error("Error loading deal room:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading || !deal) {
    return (
      <div className="grid min-h-[400px] place-items-center rounded-2xl bg-white p-8 shadow-soft">
        <div className="flex items-center gap-3 text-[#B96832] font-semibold">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#B96832] border-t-transparent" />
          Loading Deal Room...
        </div>
      </div>
    );
  }

  const total = deal.agreedPrice * deal.quantityQt;

  async function handleChooseMode(option: "Direct Deal" | "Use FairTrade") {
    try {
      const updated = await updateDeal(deal!.id, { transactionMode: option });
      setDeal(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleConfirmPayment() {
    try {
      const updated = await updateDeal(deal!.id, {
        paymentGiven: true,
        paymentReceived: true,
        transactionMode: "Use FairTrade",
        status: "Completed",
      });
      setDeal(updated);
    } catch (err) {
      console.error(err);
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
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E9E1D2] px-3.5 py-1.5 text-xs font-bold text-[#B96832]">
            <Handshake size={16} /> Buyer-Seller Deal Room
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#33291F]">Deal #{deal.id}</h1>
          <p className="text-sm text-[#765536] mt-0.5">
            Discuss crop lot, negotiate price, select transaction option, and generate digital bill.
          </p>
        </div>
        <Link
          to={`/bill/${deal.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#B96832] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#9D5529]"
        >
          <FileText size={18} /> View Digital Bill
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Agreed Rate" value={`${money(deal.agreedPrice)}/Qt`} icon={IndianRupee} />
        <StatCard label="Total Amount" value={money(total)} icon={IndianRupee} />
        <StatCard label="Transaction Option" value={deal.transactionMode} icon={ShieldCheck} />
        <StatCard label="Payment Status" value={deal.status} icon={RefreshCcw} />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Deal Overview & Options */}
        <section className="rounded-2xl border border-[#D8CDBB] bg-white p-6 shadow-soft space-y-6">
          <div>
            <h2 className="text-xl font-black text-[#33291F]">Agreed Deal Summary</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["Farmer", deal.farmer],
                ["Buyer", deal.buyer],
                ["Crop / Lot ID", `${deal.crop} - ${deal.lotId}`],
                ["Quantity", `${number(deal.quantityQt)} Quintals`],
                ["Quality Grade", deal.grade],
                ["Agreed Rate", `${money(deal.agreedPrice)} / Qt`],
                ["Total Transaction Value", money(total)],
                ["Date", deal.date],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl bg-[#F4EFE4] p-3.5 border border-[#D8CDBB]">
                  <span className="text-xs text-[#765536]">{label}</span>
                  <b className="block text-sm text-[#33291F] mt-0.5">{val}</b>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Choices */}
          <div className="rounded-xl border border-[#D8CDBB] p-5 bg-[#F4EFE4]">
            <h3 className="text-lg font-extrabold text-[#33291F]">Select Transaction Option</h3>
            <p className="text-xs text-[#765536] mt-0.5">
              Choose how buyer and seller record this transaction.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(["Direct Deal", "Use FairTrade"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleChooseMode(opt)}
                  className={`rounded-xl border p-4 text-left transition ${
                    deal.transactionMode === opt
                      ? "border-[#B96832] bg-[#E9E1D2] ring-2 ring-[#B96832]/20"
                      : "border-[#D8CDBB] bg-white hover:border-[#B96832]/40"
                  }`}
                >
                  <span className="font-extrabold text-[#33291F] block text-sm">{opt}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#765536]">
                    {opt === "Direct Deal"
                      ? "Buyer and seller settle payment independently. Digital bill is still generated."
                      : "FairTrade records payment given and payment received status on the digital bill."}
                  </span>
                </button>
              ))}
            </div>

            {deal.transactionMode === "Use FairTrade" && (
              <div className="mt-5 rounded-xl bg-white p-4 border border-[#D8CDBB] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="text-[#765536]"><b>Payment Given:</b> {deal.paymentGiven ? "Confirmed" : "Pending"}</p>
                    <p className="text-[#765536] mt-0.5"><b>Payment Received:</b> {deal.paymentReceived ? "Confirmed" : "Pending"}</p>
                  </div>
                  <button
                    onClick={handleConfirmPayment}
                    className="rounded-xl bg-[#555633] px-4 py-2.5 text-xs font-bold text-[#F4EFE4] shadow-sm hover:bg-[#33291F]"
                  >
                    Confirm Payment Completion
                  </button>
                </div>
              </div>
            )}

            {deal.transactionMode === "Direct Deal" && (
              <div className="mt-4 rounded-xl bg-[#F4EFE4] p-3.5 text-xs leading-relaxed text-[#765536] border border-[#D8CDBB]">
                <b>Direct Deal Selected:</b> Independent settlement outside FairTrade. Bill invoice is stored for record purposes.
              </div>
            )}
          </div>
        </section>

        {/* Chat Section */}
        <section className="rounded-2xl border border-[#D8CDBB] bg-white p-6 shadow-soft flex flex-col justify-between h-[550px]">
          <div>
            <div className="flex items-center gap-2 border-b border-[#D8CDBB] pb-3">
              <MessageSquare className="text-[#B96832]" size={20} />
              <h2 className="text-xl font-black text-[#33291F]">Buyer-Seller Chat</h2>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {messages.map((msg) => (
                <div key={msg.id} className="rounded-xl border border-[#D8CDBB] bg-[#F4EFE4] p-3 text-xs">
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
  const [deals, setDeals] = useState<Deal[]>([]);
  useEffect(() => {
    getDeals().then(setDeals).catch(console.error);
  }, []);

  const completed = deals.filter((d) => d.status === "Completed").length;
  const pending = deals.length - completed;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#33291F]">Transaction History</h1>
        <p className="mt-1 text-sm text-[#765536]">
          Real database transaction log and accessible digital bills.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Transactions" value={String(deals.length)} icon={Handshake} />
        <StatCard label="Completed Deals" value={String(completed)} icon={CheckCircle2} />
        <StatCard label="Pending Payment" value={String(pending)} icon={RefreshCcw} />
      </div>

      <Section title="Digital Bills & Deal Log">
        <div className="overflow-x-auto rounded-2xl border border-[#D8CDBB] bg-white shadow-soft">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F4EFE4] text-[#765536] font-bold">
              <tr>
                <th className="p-4">Deal ID</th>
                <th className="p-4">Farmer / Buyer</th>
                <th className="p-4">Crop / Lot</th>
                <th className="p-4">Agreed Value</th>
                <th className="p-4">Mode</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CDBB]">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-[#F4EFE4] transition">
                  <td className="p-4 font-black">
                    <Link to={`/deal-room/${deal.id}`} className="text-[#B96832] hover:underline">
                      {deal.id}
                    </Link>
                  </td>
                  <td className="p-4 font-semibold text-[#33291F]">{deal.farmer} / {deal.buyer}</td>
                  <td className="p-4 text-[#765536]">{deal.crop} - {deal.lotId}</td>
                  <td className="p-4 font-black text-[#33291F]">{money(deal.agreedPrice * deal.quantityQt)}</td>
                  <td className="p-4 text-xs font-medium">{deal.transactionMode}</td>
                  <td className="p-4">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${statusClass(deal.status)}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link to={`/bill/${deal.id}`} className="font-bold text-xs text-[#B96832] hover:underline flex items-center gap-1">
                      <FileText size={14} /> View Bill
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            {deal.status}
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

function statusClass(status: string) {
  if (status === "Completed") return "bg-cyan-50 text-cyan-700";
  if (status === "Failed") return "bg-red-50 text-red-700";
  if (status === "In Progress") return "bg-[#555633] text-[#F4EFE4]";
  return "bg-[#E9E1D2] text-[#33291F]";
}
