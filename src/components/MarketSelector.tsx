import { marketQuotes } from "../data/mockData";
import type { MarketQuote } from "../types";

type Props = {
  quote: MarketQuote;
  onChange: (quote: MarketQuote) => void;
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function MarketSelector({ quote, onChange }: Props) {
  const states = unique(marketQuotes.map((item) => item.state));
  const cities = unique(marketQuotes.filter((item) => item.state === quote.state).map((item) => item.city));
  const mandis = unique(marketQuotes.filter((item) => item.city === quote.city).map((item) => item.mandi));
  const crops = unique(marketQuotes.filter((item) => item.mandi === quote.mandi).map((item) => item.crop));
  const grades = unique(marketQuotes.filter((item) => item.mandi === quote.mandi && item.crop === quote.crop).map((item) => item.grade));

  function update(field: keyof MarketQuote, value: string) {
    const criteria = { state: quote.state, city: quote.city, mandi: quote.mandi, crop: quote.crop, grade: quote.grade, [field]: value };
    const next =
      marketQuotes.find((item) =>
        Object.entries(criteria).every(([key, itemValue]) => item[key as keyof MarketQuote] === itemValue),
      ) ??
      marketQuotes.find((item) => item[field] === value) ??
      quote;
    onChange(next);
  }

  const selectClass = "w-full rounded-md border border-field/15 bg-white px-3 py-3 text-sm text-ink shadow-sm outline-none transition focus:border-field";
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["State", "state", states],
        ["City", "city", cities],
        ["Mandi", "mandi", mandis],
        ["Crop", "crop", crops],
        ["Grade", "grade", grades],
      ].map(([label, field, options]) => (
        <label key={field as string} className="text-sm font-semibold text-ink/70">
          {label as string}
          <select className={selectClass} value={quote[field as keyof MarketQuote] as string} onChange={(event) => update(field as keyof MarketQuote, event.target.value)}>
            {(options as string[]).map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
