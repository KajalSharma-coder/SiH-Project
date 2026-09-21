import { Package } from "lucide-react";

type MarketSymbolProps = {
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { wrap: "h-9 w-9", icon: 17 },
  md: { wrap: "h-10 w-10", icon: 19 },
  lg: { wrap: "h-12 w-12", icon: 22 },
};

export function MarketSymbol({ size = "md" }: MarketSymbolProps) {
  const current = sizes[size];

  return (
    <span className={`grid ${current.wrap} shrink-0 place-items-center rounded-md bg-[#E9E1D2] text-[#B96832]`}>
      <Package size={current.icon} />
    </span>
  );
}
