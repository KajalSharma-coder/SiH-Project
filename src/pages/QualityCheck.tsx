import { CheckCircle2, ClipboardCheck, FlaskConical, Loader2, Search, Send, TestTube2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createQualitySample, getMarkets, getQualitySample, getQualitySamples, updateQualityResult, updateQualitySampleStatus, } from "../services/api";
import type { Market, QualityResult, QualitySample, QualitySampleStatus } from "../types";
import { EmptyState, PageHeader } from "./Market";

const inputClass = "w-full rounded-md border border-[#D8CDBB] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#B96832] focus:ring-2 focus:ring-[#B96832]/15";
const crops = ["Wheat", "Rice", "Mustard", "Maize", "Gram"];
const qualityResults: QualityResult[] = ["Alpha", "Beta", "Gamma"];

export function QualityCheck() {
  const { user } = useAuth();
  const [samples, setSamples] = useState<QualitySample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getQualitySamples()
      .then((items) => {
        if (!cancelled) setSamples(items);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Failed to load quality samples.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <PageHeader title="Quality Check" subtitle="Register your crop sample and track its quality testing status." />
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
      {user.role === "Farmer" ? (
        <FarmerQualityView samples={samples} loading={loading} onSamplesChange={setSamples} onError={setError} />
      ) : (
        <WarehouseQualityView samples={samples} loading={loading} onSamplesChange={setSamples} onError={setError} />
      )}
    </div>
  );
}

function FarmerQualityView({ samples, loading, onSamplesChange, onError }: { samples: QualitySample[]; loading: boolean; onSamplesChange: (samples: QualitySample[]) => void; onError: (message: string | null) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [registeredSample, setRegisteredSample] = useState<QualitySample | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onError(null);
    setSubmitting(true);
    try {
      const sample = await createQualitySample({
        crop: String(form.get("crop") || ""),
        state: String(form.get("state") || ""),
        district: String(form.get("district") || ""),
        location: String(form.get("location") || ""),
        mandi: String(form.get("mandi") || ""),
        quantity: form.get("quantity") ? Number(form.get("quantity")) : undefined,
      });
      setRegisteredSample(sample);
      onSamplesChange([sample, ...samples]);
      event.currentTarget.reset();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Failed to register crop sample.");
    } finally {
      setSubmitting(false);
    }
  }

  async function markOutForTesting(sample: QualitySample) {
    if (sample.status !== "REGISTERED" || !window.confirm("Are you sure you want to mark this sample as Out for Testing?")) return;
    onError(null);
    setWorkingId(sample.sampleId);
    try {
      const updated = await updateQualitySampleStatus(sample.sampleId, "OUT_FOR_TESTING");
      onSamplesChange(samples.map((item) => item.sampleId === updated.sampleId ? updated : item));
      setRegisteredSample((current) => current?.sampleId === updated.sampleId ? updated : current);
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Failed to update sample status.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <>
      <section className="rounded-md border border-[#D8CDBB] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#E9E1D2] text-[#B96832]"><FlaskConical size={20} /></div>
          <div>
            <h2 className="font-black">Register Crop Sample</h2>
            <p className="mt-1 text-sm text-[#765536]">Create a permanent sample record before sending the physical sample to the warehouse.</p>
          </div>
        </div>
        <form onSubmit={handleRegister} className="mt-5 grid gap-4 md:grid-cols-2">
          <SelectField name="crop" label="Crop" options={crops} />
          <MarketLocationFields />
          <InputField name="quantity" label="Sample Quantity (optional)" type="number" min="0.01" step="0.01" placeholder="10" />
          <div className="flex items-end justify-end md:col-span-2">
            <button disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-[#B96832] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#9D5529] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <Loader2 size={17} className="animate-spin" /> : <ClipboardCheck size={17} />}
              {submitting ? "Registering..." : "Register Crop Sample"}
            </button>
          </div>
        </form>
      </section>

      {registeredSample && <SuccessCard sample={registeredSample} />}

      <section className="space-y-3">
        <div className="flex items-center gap-2"><TestTube2 size={19} className="text-[#B96832]" /><h2 className="font-black">My Samples</h2></div>
        {loading ? <LoadingSamples /> : samples.length === 0 ? <EmptyState text="No crop samples registered yet." /> : (
          <div className="overflow-x-auto rounded-md border border-[#D8CDBB] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F4EFE4] text-[#765536]"><tr>{["Sample ID", "Crop", "Location", "Status", "Quality", "Created Date", "Action"].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#D8CDBB]">{samples.map((sample) => (
                <tr key={sample.sampleId}>
                  <td className="p-4 font-black">{sample.sampleId}</td>
                  <td className="p-4 font-semibold">{sample.crop}</td>
                  <td className="p-4 text-[#765536]">{sample.location}, {sample.district}, {sample.state}{sample.mandi ? `, ${sample.mandi}` : ""}</td>
                  <td className="p-4"><StatusBadge status={sample.status} /></td>
                  <td className="p-4 font-bold">{sample.qualityResult || "Pending"}</td>
                  <td className="p-4 whitespace-nowrap text-[#765536]">{formatDate(sample.createdAt)}</td>
                  <td className="p-4">{sample.status === "REGISTERED" ? <button type="button" disabled={workingId === sample.sampleId} onClick={() => void markOutForTesting(sample)} className="inline-flex items-center gap-1 rounded-md bg-[#B96832] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><Send size={14} />Out for Testing</button> : <span className="text-xs font-bold text-[#765536]">{sample.status === "TESTED" ? "Completed" : "Submitted"}</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function WarehouseQualityView({ samples, loading, onSamplesChange, onError }: { samples: QualitySample[]; loading: boolean; onSamplesChange: (samples: QualitySample[]) => void; onError: (message: string | null) => void }) {
  const [sampleId, setSampleId] = useState("");
  const [selected, setSelected] = useState<QualitySample | null>(null);
  const [result, setResult] = useState<QualityResult>("Alpha");
  const [working, setWorking] = useState(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError(null);
    setWorking(true);
    try {
      setSelected(await getQualitySample(sampleId));
    } catch (reason) {
      setSelected(null);
      onError(reason instanceof Error ? reason.message : "Sample ID not found.");
    } finally {
      setWorking(false);
    }
  }

  async function startTesting() {
    if (!selected) return;
    onError(null);
    setWorking(true);
    try {
      const updated = await updateQualitySampleStatus(selected.sampleId, "TESTING");
      setSelected(updated);
      onSamplesChange(samples.map((item) => item.sampleId === updated.sampleId ? updated : item));
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Failed to start testing.");
    } finally {
      setWorking(false);
    }
  }

  async function saveResult() {
    if (!selected) return;
    onError(null);
    setWorking(true);
    try {
      const updated = await updateQualityResult(selected.sampleId, result);
      setSelected(updated);
      onSamplesChange(samples.map((item) => item.sampleId === updated.sampleId ? updated : item));
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Failed to update quality result.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <section className="rounded-md border border-[#D8CDBB] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#E9E1D2] text-[#B96832]"><Search size={20} /></div><div><h2 className="font-black">Find Sample</h2><p className="mt-1 text-sm text-[#765536]">Search by the exact Sample ID to manage warehouse testing.</p></div></div>
        <form onSubmit={search} className="mt-5 flex flex-col gap-3 sm:flex-row"><input required value={sampleId} onChange={(event) => setSampleId(event.target.value)} placeholder="QC-2026-1001" className={`${inputClass} sm:flex-1`} /><button disabled={working} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#555633] px-5 py-3 text-sm font-bold text-[#F4EFE4] disabled:opacity-60"><Search size={17} />Search</button></form>
      </section>

      {loading ? <LoadingSamples /> : selected ? <section className="rounded-md border border-[#D8CDBB] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#765536]">Sample ID</p><h2 className="mt-1 text-2xl font-black">{selected.sampleId}</h2></div><StatusBadge status={selected.status} /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Info label="Crop" value={selected.crop} /><Info label="Grown At" value={`${selected.location}, ${selected.district}, ${selected.state}`} /><Info label="Mandi" value={selected.mandi || "-"} /><Info label="Quality" value={selected.qualityResult || "Pending"} /></div><div className="mt-5 flex flex-wrap items-end gap-3">{selected.status === "OUT_FOR_TESTING" && <button type="button" disabled={working} onClick={() => void startTesting()} className="inline-flex items-center gap-2 rounded-md border border-[#555633] px-4 py-3 text-sm font-bold text-[#555633] disabled:opacity-60"><TestTube2 size={17} />Start Testing</button>}{(selected.status === "OUT_FOR_TESTING" || selected.status === "TESTING") && <label className="min-w-44 text-xs font-bold text-[#765536]">Quality Result<select value={result} onChange={(event) => setResult(event.target.value as QualityResult)} className={`${inputClass} mt-1`}>{qualityResults.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>}{(selected.status === "OUT_FOR_TESTING" || selected.status === "TESTING") && <button type="button" disabled={working} onClick={() => void saveResult()} className="inline-flex items-center gap-2 rounded-md bg-[#B96832] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"><CheckCircle2 size={17} />Update Quality</button>}</div>{selected.status === "TESTED" && <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-800">Quality result updated successfully.</p>}</section> : <EmptyState text="Search a Sample ID to view testing details." />}

      <section className="space-y-3"><div className="flex items-center gap-2"><ClipboardCheck size={19} className="text-[#B96832]" /><h2 className="font-black">Samples Awaiting Testing</h2></div>{samples.length === 0 ? <EmptyState text="No crop samples registered yet." /> : <div className="grid gap-3 md:grid-cols-2">{samples.slice(0, 6).map((sample) => <article key={sample.sampleId} className="rounded-md border border-[#D8CDBB] bg-white p-4"><div className="flex items-start justify-between gap-3"><p className="font-black">{sample.sampleId}</p><StatusBadge status={sample.status} /></div><p className="mt-2 text-sm font-semibold">{sample.crop}</p><p className="mt-1 text-sm text-[#765536]">{sample.location}, {sample.district}, {sample.state}</p></article>)}</div>}</section>
    </>
  );
}

function SuccessCard({ sample }: { sample: QualitySample }) {
  return <section className="rounded-md border border-green-200 bg-green-50 p-5 text-green-900"><div className="flex items-center gap-2"><CheckCircle2 size={20} /><h2 className="font-black">Sample Registered Successfully</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-4"><Info label="Sample ID" value={sample.sampleId} /><Info label="Crop" value={sample.crop} /><Info label="Location" value={`${sample.location}, ${sample.district}, ${sample.state}`} /><Info label="Mandi" value={sample.mandi || "-"} /></div></section>;
}

function MarketLocationFields() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [location, setLocation] = useState("");
  const [mandi, setMandi] = useState("");

  useEffect(() => {
    getMarkets().then((items) => {
      setMarkets(items);
      const defaultMarket = items.find((item) => item.name === "Ramganj Mandi") || items[0];
      if (defaultMarket) {
        setState(defaultMarket.state);
        setDistrict(defaultMarket.city);
        setLocation(defaultMarket.city);
        setMandi(defaultMarket.name);
      }
    }).catch(console.error);
  }, []);

  const states = uniqueValues(markets.map((item) => item.state));
  const districts = uniqueValues(markets.filter((item) => item.state === state).map((item) => item.city));
  const matchingMarkets = markets.filter((item) => item.state === state && item.city === district);
  const locations = uniqueValues([district, ...matchingMarkets.map((item) => item.city)]);
  const mandis = uniqueValues(matchingMarkets.map((item) => item.name));

  function updateState(value: string) {
    const nextDistrict = uniqueValues(markets.filter((market) => market.state === value).map((market) => market.city))[0] || "";
    const nextMarket = markets.find((item) => item.state === value && item.city === nextDistrict);
    setState(value);
    setDistrict(nextDistrict);
    setLocation(nextDistrict);
    setMandi(nextMarket?.name || "");
  }

  function updateDistrict(value: string) {
    const nextMarket = markets.find((item) => item.state === state && item.city === value);
    setDistrict(value);
    setLocation(value);
    setMandi(nextMarket?.name || "");
  }

  return <>
    <SelectField name="state" label="State" options={states} value={state} onChange={updateState} />
    <SelectField name="district" label="District" options={districts} value={district} onChange={updateDistrict} />
    <SelectField name="location" label="Village / Location" options={locations} value={location} onChange={setLocation} />
    <SelectField name="mandi" label="Mandi" options={mandis} value={mandi} onChange={setMandi} />
  </>;
}

function StatusBadge({ status }: { status: QualitySampleStatus }) {
  const styles = { REGISTERED: "bg-[#E9E1D2] text-[#765536]", OUT_FOR_TESTING: "bg-orange-100 text-orange-800", TESTING: "bg-blue-100 text-blue-800", TESTED: "bg-green-100 text-green-800" };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>{status.replaceAll("_", " ")}</span>;
}

function InputField({ name, label, placeholder, type = "text", min, step }: { name: string; label: string; placeholder?: string; type?: string; min?: string; step?: string }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold text-[#765536]">{label}</span><input required={name !== "quantity"} name={name} type={type} min={min} step={step} placeholder={placeholder} className={inputClass} /></label>;
}

function SelectField({ name, label, options, value, onChange }: { name: string; label: string; options: string[]; value?: string; onChange?: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold text-[#765536]">{label}</span><select required name={name} value={value} onChange={(event) => onChange?.(event.target.value)} className={inputClass}><option value="">Select {label}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-[#F4EFE4] p-3"><p className="text-xs text-[#765536]">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}

function LoadingSamples() {
  return <div className="flex items-center gap-2 rounded-md border border-[#D8CDBB] bg-white p-5 text-sm font-semibold text-[#765536]"><Loader2 size={17} className="animate-spin text-[#B96832]" />Loading samples...</div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
