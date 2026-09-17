import { CheckCircle2, Download, FileText, Handshake, IndianRupee, MessageSquare, Printer, RefreshCcw, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Section, StatCard } from "../components/Cards";
import { getChatMessages, getDeals, saveChatMessage, updateDeal } from "../services/storage";
import { money, number } from "../utils/format";

export function DealRoom() {
  const { id = "DL-9001" } = useParams();
  const [deal, setDeal] = useState(() => getDeals().find((item) => item.id === id) ?? getDeals()[0]);
  const [mode, setMode] = useState<"Direct Deal" | "Use FairTrade">(deal.transactionMode);
  const [messages, setMessages] = useState(() => [
    ...getChatMessages(deal.id),
  ]);
  const total = deal.agreedPrice * deal.quantityQt;

  function markPaid() {
    const next = updateDeal(deal.id, { paymentGiven: true, paymentReceived: true, transactionMode: "Use FairTrade", status: "Completed" });
    if (next) setDeal(next);
  }

  function chooseMode(option: "Direct Deal" | "Use FairTrade") {
    setMode(option);
    const next = updateDeal(deal.id, { transactionMode: option });
    if (next) setDeal(next);
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("message") || "").trim();
    if (!text) return;
    setMessages(saveChatMessage({
      id: `${deal.id}-${Date.now()}`,
      dealId: deal.id,
      sender: mode === "Use FairTrade" ? "FairTrade Desk" : deal.buyer,
      text,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    }));
    event.currentTarget.reset();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Buyer-Seller Deal Room</h1>
          <p className="mt-1 text-sm text-ink/60">{deal.id} - finalize agreed crop lot, chat, payment mode and bill.</p>
        </div>
        <Link to={`/bill/${deal.id}`} className="inline-flex items-center gap-2 rounded-md bg-field px-4 py-3 text-sm font-bold text-white">
          <FileText size={16} /> Open Bill
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Agreed price" value={`${money(deal.agreedPrice)}/Qt`} icon={IndianRupee} />
        <StatCard label="Total amount" value={money(total)} icon={IndianRupee} />
        <StatCard label="Transaction mode" value={mode} icon={ShieldCheck} />
        <StatCard label="Deal status" value={deal.status} icon={RefreshCcw} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black">Agreed Deal Details</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries({
              Farmer: deal.farmer,
              Buyer: deal.buyer,
              "Crop / lot": `${deal.crop} - ${deal.lotId}`,
              Quantity: `${number(deal.quantityQt)} Qt`,
              "Quality / grade": deal.grade,
              "Offer / counter": `${money(deal.offer)} / ${money(deal.counterOffer)}`,
              "Agreed rate": `${money(deal.agreedPrice)}/Qt`,
              "Total value": money(total),
            }).map(([label, value]) => (
              <p key={label} className="rounded-md bg-cream p-3 text-sm text-ink/65">
                {label}<b className="block text-base text-ink">{value}</b>
              </p>
            ))}
          </div>

          <div className="mt-5 rounded-md border border-field/10 p-4">
            <p className="font-black">Choose transaction option</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {(["Direct Deal", "Use FairTrade"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => chooseMode(option)}
                  className={`rounded-md border p-4 text-left transition ${mode === option ? "border-field bg-leaf/10" : "border-field/10 bg-white hover:border-field/40"}`}
                >
                  <span className="font-black">{option}</span>
                  <span className="mt-1 block text-sm text-ink/60">
                    {option === "Direct Deal" ? "Buyer and seller settle independently; FairTrade bill is still generated." : "FairTrade records payment given and payment received confirmations."}
                  </span>
                </button>
              ))}
            </div>
            {mode === "Use FairTrade" && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-cream p-4">
                <div className="text-sm">
                  <p><b>Payment Given:</b> {deal.paymentGiven ? "Confirmed" : "Pending"}</p>
                  <p><b>Payment Received:</b> {deal.paymentReceived ? "Confirmed" : "Pending"}</p>
                </div>
                <button onClick={markPaid} className="rounded-md bg-field px-5 py-3 text-sm font-bold text-white">Confirm Payment Complete</button>
              </div>
            )}
            {mode === "Direct Deal" && (
              <div className="mt-4 rounded-md bg-cream p-4 text-sm leading-6 text-ink/68">
                Direct Deal selected. Buyer and seller can settle independently, while FairTrade still generates the digital invoice for record access.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-field" size={20} />
            <h2 className="text-xl font-black">Chat</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-md bg-cream p-3">
              <p className="text-xs font-bold text-field">{deal.farmer}</p>
              <p className="text-sm text-ink/70">Quality sample is verified. Loading can be arranged tomorrow morning.</p>
            </div>
            <div className="rounded-md bg-field p-3 text-white">
              <p className="text-xs font-bold text-white/80">{deal.buyer}</p>
              <p className="text-sm">Agreed at {money(deal.agreedPrice)}/Qt. Please share payment confirmation after weighing.</p>
            </div>
            {messages.map((message) => (
              <div key={message.id} className="rounded-md border border-field/10 bg-white p-3">
                <p className="text-xs font-bold text-field">{message.sender} <span className="font-medium text-ink/45">{message.time}</span></p>
                <p className="text-sm text-ink/70">{message.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="mt-4 flex gap-2">
            <input name="message" className="min-w-0 flex-1 rounded-md border border-field/15 px-3 py-3 text-sm outline-none focus:border-field" placeholder="Type message..." />
            <button className="rounded-md bg-field px-4 py-3 text-sm font-bold text-white">Send</button>
          </form>
        </section>
      </div>
    </div>
  );
}

export function Transactions() {
  const deals = getDeals();
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Transaction History</h1>
      <p className="mt-1 text-sm text-ink/60">Completed and ongoing deals with accessible bills and clear payment status.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <StatCard label="Total transactions" value={String(deals.length)} icon={Handshake} />
        <StatCard label="Completed" value={String(deals.filter((deal) => deal.status === "Completed").length)} icon={CheckCircle2} />
        <StatCard label="Ongoing" value={String(deals.filter((deal) => deal.status !== "Completed").length)} icon={RefreshCcw} />
      </div>
      <Section title="Bills and Deal Status">
        <div className="overflow-x-auto rounded-md border border-field/10 bg-white shadow-soft">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-cream text-ink/65">
              <tr>
                <th className="p-3">Deal</th>
                <th className="p-3">Parties</th>
                <th className="p-3">Crop / lot</th>
                <th className="p-3">Value</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Bill</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="border-t border-field/10">
                  <td className="p-3 font-black"><Link className="text-field" to={`/deal-room/${deal.id}`}>{deal.id}</Link></td>
                  <td className="p-3">{deal.farmer} / {deal.buyer}</td>
                  <td className="p-3">{deal.crop} - {deal.lotId}</td>
                  <td className="p-3 font-bold">{money(deal.agreedPrice * deal.quantityQt)}</td>
                  <td className="p-3">{deal.transactionMode}</td>
                  <td className="p-3"><span className="rounded-md bg-cream px-2 py-1 text-xs font-bold">{deal.status}</span></td>
                  <td className="p-3"><Link className="font-bold text-field" to={`/bill/${deal.id}`}>View bill</Link></td>
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
  const deal = useMemo(() => getDeals().find((item) => item.id === id) ?? getDeals()[0], [id]);
  const total = deal.agreedPrice * deal.quantityQt;
  function download() {
    const body = `FairTrade Digital Bill ${deal.id}\nDate: ${deal.date}\nTransaction Mode: ${deal.transactionMode}\nFarmer: ${deal.farmer}\nBuyer: ${deal.buyer}\nCrop/Lot: ${deal.crop} - ${deal.lotId}\nQuantity: ${deal.quantityQt} Qt\nQuality/Grade: ${deal.grade}\nAgreed Rate: ${deal.agreedPrice}/Qt\nTotal Value: ${total}\nPayment Status: ${deal.status}\nPayment Given: ${deal.paymentGiven ? "Yes" : "No"}\nPayment Received: ${deal.paymentReceived ? "Yes" : "No"}`;
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deal.id}-fairtrade-bill.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="rounded-md border border-field/10 bg-white p-6 shadow-soft">
      <div className="no-print mb-5 flex flex-wrap justify-end gap-2">
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border border-field/20 px-4 py-2 font-bold text-field"><Printer size={16} /> Print</button>
        <button onClick={download} className="inline-flex items-center gap-2 rounded-md bg-field px-4 py-2 font-bold text-white"><Download size={16} /> Download</button>
      </div>
      <div className="border-b border-field/10 pb-5">
        <p className="text-sm font-bold text-field">FairTrade Digital Bill / Invoice</p>
        <h1 className="text-3xl font-black">{deal.id}</h1>
        <p className="text-sm text-ink/60">Date: {deal.date} - Mode: {deal.transactionMode} - Payment Status: {deal.status}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <BillRow label="Farmer" value={deal.farmer} />
        <BillRow label="Buyer" value={deal.buyer} />
        <BillRow label="Transaction mode" value={deal.transactionMode} />
        <BillRow label="Crop / lot" value={`${deal.crop} - ${deal.lotId}`} />
        <BillRow label="Quantity" value={`${deal.quantityQt} Quintal`} />
        <BillRow label="Quality / grade" value={deal.grade} />
        <BillRow label="Agreed rate" value={`${money(deal.agreedPrice)} / Quintal`} />
        <BillRow label="Payment given" value={deal.paymentGiven ? "Confirmed" : "Pending"} />
        <BillRow label="Payment received" value={deal.paymentReceived ? "Confirmed" : "Pending"} />
        <BillRow label="Total value" value={money(total)} strong />
      </div>
    </div>
  );
}

function BillRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="rounded-md bg-cream p-4"><p className="text-sm text-ink/55">{label}</p><p className={`mt-1 ${strong ? "text-2xl font-black text-field" : "font-bold"}`}>{value}</p></div>;
}
