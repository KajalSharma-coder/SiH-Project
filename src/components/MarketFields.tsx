import { useEffect, useMemo, useState } from "react";
import { getMarkets } from "../services/api";
import type { Market } from "../types";

type MarketFieldsProps = {
  cityLabel: string;
  mandiLabel: string;
  inputClass: string;
};

export function MarketFields({ cityLabel, mandiLabel, inputClass }: MarketFieldsProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState("");

  useEffect(() => {
    getMarkets()
      .then((items) => {
        setMarkets(items);
        const defaultMarket = items.find((market) => market.name === "Ramganj Mandi") || items[0];
        setSelectedMarketId(defaultMarket?.id || "");
      })
      .catch(console.error);
  }, []);

  const selectedMarket = useMemo(
    () => markets.find((market) => market.id === selectedMarketId) || markets[0],
    [markets, selectedMarketId],
  );

  return (
    <>
      <input type="hidden" name="mandi" value={selectedMarket?.name || ""} />
      <label>
        <span className="mb-1 block text-xs font-bold text-[#765536]">{cityLabel}</span>
        <input name="city" required readOnly value={selectedMarket?.city || ""} className={inputClass} />
      </label>
      <label>
        <span className="mb-1 block text-xs font-bold text-[#765536]">{mandiLabel}</span>
        <select
          name="marketId"
          required
          value={selectedMarket?.id || ""}
          onChange={(event) => setSelectedMarketId(event.target.value)}
          className={inputClass}
        >
          {markets.map((market) => (
            <option key={market.id} value={market.id}>
              {market.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
