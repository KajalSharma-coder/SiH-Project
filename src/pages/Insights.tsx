import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, Package } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ForecastChart } from "../components/ForecastChart";
import { MarketSelector } from "../components/MarketSelector";
import { StatCard } from "../components/Cards";
import { MarketSymbol } from "../components/MarketSymbol";
import { useI18n } from "../context/I18nContext";
import { ApiError, getMarketQuotes, getMlPrediction } from "../services/api";
import type { ForecastPoint, MarketQuote, MLPredictionResponse } from "../types";
import { money } from "../utils/format";
import { Loading, PageHeader } from "./Market";

const inputClass = "mt-1 w-full rounded-md border border-[#D8CDBB] bg-white px-3 py-3 text-sm normal-case text-[#33291F] outline-none focus:border-[#B96832] focus:ring-2 focus:ring-[#B96832]/15";

export function PricePrediction() {
  const { t } = useI18n();
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [period, setPeriod] = useState("7 Days");
  const [loading, setLoading] = useState(true);
  const [mlPrediction, setMlPrediction] = useState<MLPredictionResponse | null>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);
  const predictionInFlight = useRef(false);
  const [form, setForm] = useState({
    crop: "",
    state: "",
    district: "",
    market: "",
    predictionDays: 7,
  });

  useEffect(() => {
    getMarketQuotes()
      .then((data) => {
        setQuotes(data);
        setQuote(data[0] ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const periodDays = Number(period.match(/\d+/)?.[0] || 7);

  useEffect(() => {
    if (!quote) return;
    setForm({
      crop: quote.crop,
      state: quote.state,
      district: quote.city,
      market: quote.mandi,
      predictionDays: periodDays,
    });
  }, [quote, periodDays]);

  const crops = useMemo(() => uniqueOptions(quotes.map((item) => item.crop), ["Wheat", "Rice", "Mustard", "Maize", "Gram"]), [quotes]);
  const states = useMemo(() => uniqueOptions(quotes.map((item) => item.state), ["Rajasthan"]), [quotes]);
  const districts = useMemo(
    () => uniqueOptions(quotes.filter((item) => !form.state || item.state === form.state).map((item) => item.city), form.district ? [form.district] : []),
    [form.district, form.state, quotes],
  );
  const markets = useMemo(
    () =>
      uniqueOptions(
        quotes
          .filter((item) => (!form.state || item.state === form.state) && (!form.district || item.city === form.district))
          .map((item) => item.mandi),
        form.market ? [form.market] : [],
      ),
    [form.district, form.market, form.state, quotes],
  );

  function updateForm(field: keyof typeof form, value: string | number) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      const matchingQuotes = quotes.filter((item) => (!next.state || item.state === next.state) && (!next.district || item.city === next.district));

      if (field === "state") {
        const firstDistrict = quotes.find((item) => item.state === value)?.city || "";
        next.district = firstDistrict;
        next.market = quotes.find((item) => item.state === value && item.city === firstDistrict)?.mandi || "";
      }

      if (field === "district") {
        next.market = matchingQuotes.find((item) => item.city === value)?.mandi || "";
      }

      return next;
    });
  }

  async function handlePredict() {
    if (predictionInFlight.current) return;

    predictionInFlight.current = true;
    setMlLoading(true);
    setMlError(null);

    try {
      const prediction = await getMlPrediction(form);
      setMlPrediction(prediction);
    } catch (error) {
      setMlError(getPredictionErrorMessage(error));
    } finally {
      predictionInFlight.current = false;
      setMlLoading(false);
    }
  }

  if (loading || !quote) {
    return <Loading text={t("price.loading")} />;
  }

  const currentPrice = mlPrediction?.currentPrice ?? quote.currentPrice;
  const mlForecast = mlPrediction ? buildMlForecast(mlPrediction) : null;
  const fallbackForecast = normalizeForecastSeries(quote.forecast);
  const forecastData = mlForecast?.length ? mlForecast : fallbackForecast;
  const chartData = mlForecast ?? [];
  const forecast = forecastData.filter((point) => isFiniteNumber(point.price));
  const predicted = mlPrediction?.predictions.at(-1)?.predictedPrice ?? forecast.at(-1)?.price ?? currentPrice;
  const change = predicted - currentPrice;
  const changePercent = currentPrice ? (change / currentPrice) * 100 : 0;
  const confidence = mlPrediction?.predictions.at(-1)?.confidence ?? quote.confidence;
  const ChangeIcon = change >= 0 ? ArrowUpRight : ArrowDownRight;
  const trend = getPriceTrend(mlPrediction);

  return (
    <div className="space-y-5">
      <PageHeader title={t("price.title")} subtitle={t("price.subtitle")} />

      <section className="rounded-md border border-[#D8CDBB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
          <MarketSelector quote={quote} quotes={quotes} onChange={setQuote} />
          <label className="text-xs font-bold uppercase tracking-wide text-[#765536]">
            {t("price.timePeriod")}
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className={inputClass}>
              <option>7 Days</option>
              <option>14 Days</option>
              <option>30 Days</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-md border border-[#D8CDBB] bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black text-[#33291F]">AI Price Prediction</h2>
            <p className="mt-1 text-sm text-[#765536]">Generate a market-specific forecast using the trained FairTrade ML model.</p>
          </div>
          {mlPrediction && <span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#33291F]">{trend}</span>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <PredictionSelect label="Crop" value={form.crop} options={crops} onChange={(value) => updateForm("crop", value)} />
          <PredictionSelect label="State" value={form.state} options={states} onChange={(value) => updateForm("state", value)} />
          <PredictionSelect label="District" value={form.district} options={districts} onChange={(value) => updateForm("district", value)} />
          <PredictionSelect label="Market" value={form.market} options={markets} onChange={(value) => updateForm("market", value)} />
          <label className="text-xs font-bold uppercase tracking-wide text-[#765536]">
            Prediction Days
            <select value={form.predictionDays} onChange={(event) => updateForm("predictionDays", Number(event.target.value))} className={inputClass}>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePredict}
            disabled={mlLoading || !form.crop || !form.state || !form.district || !form.market}
            className="inline-flex items-center gap-2 rounded-md bg-[#555633] px-5 py-3 text-sm font-bold text-[#F4EFE4] transition hover:bg-[#464729] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BarChart3 size={17} />
            {mlLoading ? "Predicting..." : "Predict Price"}
          </button>
          {mlError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{mlError}</p>}
        </div>

        {mlPrediction && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]">
            <div className="rounded-md bg-[#F4EFE4] p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#765536]">
                <Package size={15} className="text-[#B96832]" />
                Current Price
              </p>
              <p className="mt-2 text-2xl font-black text-[#33291F]">{money(mlPrediction.currentPrice)}/qt</p>
              <p className="mt-2 text-sm text-[#765536]">{mlPrediction.crop} at {mlPrediction.market}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#765536]">Price Trend</p>
              <p className="mt-1 font-black text-[#33291F]">{trend}</p>
            </div>

            <div className="overflow-x-auto rounded-md border border-[#D8CDBB]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F4EFE4] text-[#765536]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Predicted Price</th>
                    <th className="p-3">Range</th>
                    <th className="p-3">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8CDBB]">
                  {mlPrediction.predictions.map((point) => (
                    <tr key={point.date}>
                      <td className="p-3 font-semibold">{new Date(point.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="p-3 font-black text-[#33291F]">{money(point.predictedPrice)}/qt</td>
                      <td className="p-3 text-[#765536]">{money(point.low)} - {money(point.high)}</td>
                      <td className="p-3 font-semibold">{point.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label={t("price.currentPrice")} value={`${money(currentPrice)}/qt`} helper={`${quote.crop} at ${quote.mandi}`} icon={Package} symbol={<MarketSymbol />} />
        <StatCard label={t("price.predictedPrice")} value={`${money(predicted)}/qt`} helper={mlLoading ? "Loading ML..." : period} icon={BarChart3} />
        <StatCard label={t("price.expectedChange")} value={`${change >= 0 ? "+" : ""}${money(change)} (${changePercent.toFixed(1)}%)`} helper={t("price.estimateOnly")} icon={ChangeIcon} />
      </div>

      <section className="rounded-md border border-[#D8CDBB] bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-black">{t("price.simpleTrend")}</h2>
          <span className="rounded-full bg-[#E9E1D2] px-3 py-1 text-xs font-bold text-[#33291F]">{t("price.confidence", { value: confidence })}</span>
        </div>
        <ForecastChart data={chartData} height={320} />
        <p className="mt-4 rounded-md bg-[#F4EFE4] p-3 text-sm text-[#765536]">
          {mlError ? `${t("price.note")} ML service unavailable: ${mlError}` : t("price.note")}
        </p>
      </section>
    </div>
  );
}

function PredictionSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wide text-[#765536]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function uniqueOptions(values: string[], fallback: string[] = []) {
  return Array.from(new Set([...values.filter(Boolean), ...fallback])).sort((a, b) => a.localeCompare(b));
}

function getPredictionErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return "Prediction failed. Please try again.";
  }

  const data = typeof error.data === "object" && error.data !== null ? error.data as { code?: string } : {};
  if (error.status === 429 || data.code === "ML_RATE_LIMITED") {
    return "Prediction service is temporarily busy. Please try again in a moment.";
  }
  if (data.code === "ML_TIMEOUT") {
    return "Prediction service timed out. Please try again.";
  }
  if ([502, 503, 504].includes(error.status)) {
    return "Prediction service is temporarily unavailable. Please try again.";
  }
  return error.message || "Prediction failed. Please try again.";
}

function buildMlForecast(prediction: MLPredictionResponse): ForecastPoint[] {
  if (!isFiniteNumber(prediction.currentPrice) || !prediction.predictions.length) return [];

  const today = new Date();
  const currentPrice = prediction.currentPrice;
  const points: ForecastPoint[] = [
    {
      label: "Today",
      price: currentPrice,
      actual: currentPrice,
      predicted: currentPrice,
      low: currentPrice,
      high: currentPrice,
      confidence: prediction.predictions[0]?.confidence ?? 90,
    },
  ];

  prediction.predictions.forEach((point, index) => {
    if (!isFiniteNumber(point.predictedPrice)) return;

    const predictedDate = new Date(point.date);
    const dateForLabel = Number.isNaN(predictedDate.getTime()) ? addDays(today, index + 1) : predictedDate;
    const price = point.predictedPrice;
    points.push({
      label: dateForLabel.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      price,
      predicted: price,
      low: isFiniteNumber(point.low) ? point.low : price,
      high: isFiniteNumber(point.high) ? point.high : price,
      confidence: isFiniteNumber(point.confidence) ? point.confidence : 0,
    });
  });

  return points;
}

function normalizeForecastSeries(points: ForecastPoint[]): ForecastPoint[] {
  const normalized: ForecastPoint[] = [];

  points.forEach((point) => {
    const price = isFiniteNumber(point.price) ? point.price : isFiniteNumber(point.predicted) ? point.predicted : point.actual;
    if (!isFiniteNumber(price)) return;

    normalized.push({
      ...point,
      price,
      low: isFiniteNumber(point.low) ? point.low : price,
      high: isFiniteNumber(point.high) ? point.high : price,
    });
  });

  return normalized;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getPriceTrend(prediction: MLPredictionResponse | null) {
  if (!prediction || !prediction.predictions.length) return "Stable";

  const first = prediction.predictions[0].predictedPrice;
  const last = prediction.predictions[prediction.predictions.length - 1].predictedPrice;
  const movement = last - first;

  if (Math.abs(movement) < Math.max(1, prediction.currentPrice * 0.002)) return "Stable";
  return movement > 0 ? "Increasing" : "Decreasing";
}

export function DailyPriceTracking() {
  const { t } = useI18n();
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedMandi, setSelectedMandi] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketQuotes()
      .then(setQuotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const crops = useMemo(() => Array.from(new Set(quotes.map((quote) => quote.crop))).sort(), [quotes]);
  const mandis = useMemo(() => Array.from(new Set(quotes.map((quote) => quote.mandi))).sort(), [quotes]);

  const rows = useMemo(
    () =>
      quotes
        .filter((quote) => {
          const matchesDate = !selectedDate || getDateKey(quote.updatedAt) === selectedDate;
          const matchesCrop = !selectedCrop || quote.crop === selectedCrop;
          const matchesMandi = !selectedMandi || quote.mandi === selectedMandi;
          return matchesDate && matchesCrop && matchesMandi;
        })
        .slice(0, 12)
        .map((quote) => ({
          ...quote,
          date: formatTrackingDate(quote.updatedAt),
        })),
    [quotes, selectedCrop, selectedDate, selectedMandi],
  );

  if (loading) {
    return <Loading text={t("daily.loading")} />;
  }

  return (
      <div className="space-y-5">
      <PageHeader title={t("daily.title")} subtitle={t("daily.subtitle")} />

      <section className="rounded-md border border-[#D8CDBB] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
          <label className="text-xs font-bold uppercase tracking-wide text-[#765536]">
            Date
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              aria-label="Date"
              className={inputClass}
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-[#765536]">
            Crop
            <select value={selectedCrop} onChange={(event) => setSelectedCrop(event.target.value)} aria-label="Crop" className={inputClass}>
              <option value="">All Crops</option>
              {crops.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-[#765536]">
            Mandi
            <select value={selectedMandi} onChange={(event) => setSelectedMandi(event.target.value)} aria-label="Mandi" className={inputClass}>
              <option value="">All Mandis</option>
              {mandis.map((mandi) => <option key={mandi} value={mandi}>{mandi}</option>)}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setSelectedDate("");
              setSelectedCrop("");
              setSelectedMandi("");
            }}
            aria-label="Clear date, crop and mandi filters"
            className="rounded-md border border-[#555633] px-4 py-3 text-sm font-bold text-[#555633] transition hover:bg-[#F4EFE4]"
          >
            Clear Filters
          </button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-md border border-[#D8CDBB] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F4EFE4] text-[#765536]">
            <tr>
              <th className="p-4">{t("common.date")}</th>
              <th className="p-4">{t("common.crop")}</th>
              <th className="p-4">{t("common.mandi")}</th>
              <th className="p-4">{t("common.price")}</th>
              <th className="p-4">{t("daily.change")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8CDBB]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm font-semibold text-[#765536]">
                  No price records found for the selected filters.
                </td>
              </tr>
            ) : rows.map((row) => {
              const positive = row.change >= 0;
              const Icon = positive ? ArrowUpRight : ArrowDownRight;
              return (
                <tr key={row.id}>
                  <td className="p-4 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={15} className="text-[#B96832]" />
                      {row.date}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{row.crop}</td>
                  <td className="p-4 text-[#765536]">{row.mandi}, {row.city}</td>
                  <td className="p-4 font-black text-[#33291F]">{money(row.currentPrice)}/qt</td>
                  <td className={`p-4 font-bold ${positive ? "text-[#555633]" : "text-[#B96832]"}`}>
                    <span className="inline-flex items-center gap-1">
                      <Icon size={16} />
                      {positive ? "+" : ""}{row.change}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatTrackingDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function Reliability() {
  return <PricePrediction />;
}

export function PricePulse() {
  return <PricePrediction />;
}
