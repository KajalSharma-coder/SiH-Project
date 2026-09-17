import { Download, IndianRupee, Printer, RefreshCcw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { StatCard } from "../components/Cards";
import { getDeals, updateDeal } from "../services/storage";
import { money, number } from "../utils/format";

export function DealRoom() {
  const { id = "DL-9001" } = useParams();
  const [deal, setDeal] = useState(() => getDeals().find((item) => item.id === id) ?? getDeals()[0]);
  const total = deal.agreedPrice * deal.quantityQt;
  function markPaid() {
    const next = updateDeal(deal.id, { paymentGiven: true, paymentReceived: true, status: "Completed" });
    if (next) setDeal(next);
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Deal Room {deal.id}</h1>
      <p className="mt-1 text-sm text-ink/60">Offer, counter offer, payment and transaction status for one crop lot.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Agreed Price" value={`${money(deal.agreedPrice)}/Qt`} icon={IndianRupee} />
        <StatCard label="Total Value" value={money(total)} icon={IndianRupee} />
        <StatCard label="Payment Given" value={deal.paymentGiven ? "Yes" : "No"} icon={ShieldCheck} />
        <StatCard label="Status" value={deal.status} icon={RefreshCcw} />
      </div>
      <div className="mt-5 rounded-md bg-white p-5 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries({
            Farmer: deal.farmer,
            Buyer: deal.buyer,
            Lot: deal.lotId,
            Quantity: `${number(deal.quantityQt)} Qt`,
            Grade: deal.grade,
            "Offer / Counter": `${money(deal.offer)} / ${money(deal.counterOffer)}`,
            "Payment Received": deal.paymentReceived ? "Yes" : "No",
            Crop: deal.crop,
          }).map(([label, value]) => <p key={label} className="rounded-md bg-cream p-3 text-sm text-ink/65">{label}<b className="block text-base text-ink">{value}</b></p>)}
        </div>
        <button onClick={markPaid} className="mt-5 rounded-md bg-field px-5 py-3 font-bold text-white">Mark Payment Complete</button>
      </div>
    </div>
  );
}

export function Bill() {
  const { id = "DL-9002" } = useParams();
  const deal = useMemo(() => getDeals().find((item) => item.id === id) ?? getDeals()[0], [id]);
  const total = deal.agreedPrice * deal.quantityQt;
  function download() {
    const body = `FairTrade Bill ${deal.id}\nFarmer: ${deal.farmer}\nBuyer: ${deal.buyer}\nCrop: ${deal.crop}\nQuantity: ${deal.quantityQt} Qt\nGrade: ${deal.grade}\nRate: ${deal.agreedPrice}\nTotal: ${total}\nPayment: ${deal.status}`;
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deal.id}-fairtrade-bill.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="rounded-md bg-white p-6 shadow-soft">
      <div className="no-print mb-5 flex flex-wrap justify-end gap-2">
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border border-field/20 px-4 py-2 font-bold text-field"><Printer size={16} /> Print</button>
        <button onClick={download} className="inline-flex items-center gap-2 rounded-md bg-field px-4 py-2 font-bold text-white"><Download size={16} /> Download</button>
      </div>
      <div className="border-b border-field/10 pb-5">
        <p className="text-sm font-bold text-field">FairTrade Digital Bill</p>
        <h1 className="text-3xl font-black">{deal.id}</h1>
        <p className="text-sm text-ink/60">Date: {deal.date} · Payment Status: {deal.status}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <BillRow label="Farmer" value={deal.farmer} />
        <BillRow label="Buyer" value={deal.buyer} />
        <BillRow label="Lot" value={deal.lotId} />
        <BillRow label="Crop" value={deal.crop} />
        <BillRow label="Quantity" value={`${deal.quantityQt} Quintal`} />
        <BillRow label="Grade" value={deal.grade} />
        <BillRow label="Rate" value={`${money(deal.agreedPrice)} / Quintal`} />
        <BillRow label="Total" value={money(total)} strong />
      </div>
    </div>
  );
}

function BillRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="rounded-md bg-cream p-4"><p className="text-sm text-ink/55">{label}</p><p className={`mt-1 ${strong ? "text-2xl font-black text-field" : "font-bold"}`}>{value}</p></div>;
}
