import { useState } from "react";
import { ForecastChart } from "../components/ForecastChart";
import { MarketSelector } from "../components/MarketSelector";
import { Section } from "../components/Cards";
import { marketQuotes } from "../data/mockData";
import { money } from "../utils/format";

export function Market() {
  const [quote, setQuote] = useState(marketQuotes[0]);
  return (
    <div className="rounded-md border border-field/10 bg-white p-5 shadow-soft">
      <h1 className="text-2xl font-bold">Market</h1>
      <p className="mt-1 text-sm text-ink/60">FairTrade market intelligence is supplementary and does not replace e-NAM or official mandi notices.</p>
      <div className="mt-5"><MarketSelector quote={quote} onChange={setQuote} /></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-md bg-cream p-4">
          <p className="text-sm text-ink/60">Current / Quintal</p>
          <p className="mt-2 text-4xl font-black text-field">{money(quote.currentPrice)}</p>
          <p className="mt-2 text-sm">{quote.city} · {quote.mandi}</p>
          <p className="mt-4 text-xs font-semibold text-skyline">7-Day Indicative Forecast — actual prices may vary.</p>
        </div>
        <ForecastChart data={quote.forecast} />
      </div>
      <Section title="All matching prices">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {marketQuotes.filter((item) => item.crop === quote.crop).slice(0, 9).map((item) => (
            <button key={item.id} onClick={() => setQuote(item)} className="rounded-md border border-field/10 bg-cream/60 p-4 text-left hover:border-field">
              <p className="font-bold">{item.city} · {item.mandi}</p>
              <p className="text-sm text-ink/60">{item.grade}</p>
              <p className="mt-2 text-xl font-black text-field">{money(item.currentPrice)}/Qt</p>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
