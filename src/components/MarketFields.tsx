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
  const [selectedMarketName, setSelectedMarketName] = useState("");

  useEffect(() => {
    getMarkets()
      .then((items) => {
        setMarkets(items);
        const defaultMarket = items.find((market) => market.name === "Ramganj Mandi") || items[0];
        setSelectedMarketName(defaultMarket?.name || "");
      })
      .catch(console.error);
  }, []);

  const selectedMarket = useMemo(
    () => markets.find((market) => market.name === selectedMarketName) || markets[0],
    [markets, selectedMarketName],
  );

  return (
    <>
      <label>
        <span className="mb-1 block text-xs font-bold text-[#765536]">{cityLabel}</span>
        <input name="city" required readOnly value={selectedMarket?.city || ""} className={inputClass} />
      </label>
      <label>
        <span className="mb-1 block text-xs font-bold text-[#765536]">{mandiLabel}</span>
        <select
          name="mandi"
          required
          value={selectedMarket?.name || ""}
          onChange={(event) => setSelectedMarketName(event.target.value)}
          className={inputClass}
        >
          {markets.map((market) => (
            <option key={market.id} value={market.name}>
              {market.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
