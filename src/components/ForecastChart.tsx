import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo } from "react";
import type { ForecastPoint } from "../types";
import { money } from "../utils/format";

export function ForecastChart({ data, height = 280 }: { data: ForecastPoint[]; height?: number }) {
  const chartData = useMemo(
    () => data.filter((point): point is ForecastPoint & { price: number } => typeof point.price === "number" && Number.isFinite(point.price)),
    [data],
  );

  const yAxisDomain = useMemo<[number | string, number | string]>(() => {
    if (!chartData.length) return ["auto", "auto"];

    const prices = chartData.map((point) => point.price);
    const minimum = Math.min(...prices);
    const maximum = Math.max(...prices);
    const range = maximum - minimum;
    const padding = range > 0 ? range * 0.1 : Math.max(Math.abs(minimum) * 0.05, 1);

    return [Math.max(0, minimum - padding), maximum + padding] as [number, number];
  }, [chartData]);

  return (
    <div className="h-[280px] w-full" style={{ height }}>
      {chartData.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8CDBB" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#765536" }} />
            <YAxis
              domain={yAxisDomain}
              tickFormatter={(value) => `Rs ${value}`}
              tick={{ fontSize: 12, fill: "#765536" }}
              width={62}
            />
            <Tooltip formatter={(value: number, name) => [money(value), name]} contentStyle={{ borderRadius: 8, border: "1px solid #D8CDBB" }} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#B96832"
              strokeWidth={3}
              dot={{ r: 4, fill: "#B96832", stroke: "#FFFFFF", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-[#D8CDBB] text-sm text-[#765536]">
          Price trend data is currently unavailable.
        </div>
      )}
    </div>
  );
}
