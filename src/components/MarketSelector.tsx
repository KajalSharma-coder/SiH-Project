import type { MarketQuote } from "../types";

type Props = {
  quote: MarketQuote;
  quotes: MarketQuote[];
  onChange: (quote: MarketQuote) => void;
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function MarketSelector({ quote, quotes, onChange }: Props) {
  if (!quote || quotes.length === 0) return null;

  const states = unique(quotes.map((item) => item.state));
  const cities = unique(quotes.filter((item) => item.state === quote.state).map((item) => item.city));
  const mandis = unique(quotes.filter((item) => item.city === quote.city).map((item) => item.mandi));
  const crops = unique(quotes.filter((item) => item.mandi === quote.mandi).map((item) => item.crop));
  const grades = unique(quotes.filter((item) => item.mandi === quote.mandi && item.crop === quote.crop).map((item) => item.grade));

  function update(field: keyof MarketQuote, value: string) {
    const criteria = { state: quote.state, city: quote.city, mandi: quote.mandi, crop: quote.crop, grade: quote.grade, [field]: value };
    const next =
      quotes.find((item) =>
        Object.entries(criteria).every(([key, itemValue]) => item[key as keyof MarketQuote] === itemValue),
      ) ??
      quotes.find((item) => item[field] === value) ??
      quote;
    onChange(next);
  }

  const selectClass = "w-full rounded-xl border border-[#2f7d4d]/20 bg-white px-3.5 py-3 text-sm text-[#17312a] shadow-sm outline-none transition focus:border-[#2f7d4d] focus:ring-2 focus:ring-[#2f7d4d]/15 font-semibold";
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[
        ["State", "state", states],
        ["City", "city", cities],
        ["Mandi", "mandi", mandis],
        ["Crop", "crop", crops],
        ["Grade", "grade", grades],
      ].map(([label, field, options]) => (
        <label key={field as string} className="text-xs font-bold uppercase tracking-wider text-[#17312a]/65">
          {label as string}
          <select className={selectClass} value={quote[field as keyof MarketQuote] as string} onChange={(event) => update(field as keyof MarketQuote, event.target.value)}>
            {(options as string[]).map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
