import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ForecastPoint } from "../types";
import { money } from "../utils/format";

export function ForecastChart({ data, height = 280 }: { data: ForecastPoint[]; height?: number }) {
  return (
    <div className="h-[280px] w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#B96832" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#B96832" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#D8CDBB" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#765536" }} />
          <YAxis tickFormatter={(value) => `Rs ${value}`} tick={{ fontSize: 12, fill: "#765536" }} width={62} />
          <Tooltip formatter={(value: number, name) => [money(value), name]} contentStyle={{ borderRadius: 8, border: "1px solid #D8CDBB" }} />
          <Area type="monotone" dataKey="high" stroke="transparent" fill="url(#forecastFill)" />
          <Area type="monotone" dataKey="low" stroke="transparent" fill="#F4EFE4" />
          <Line type="monotone" dataKey="actual" stroke="#555633" strokeWidth={3} dot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="predicted" stroke="#B96832" strokeWidth={3} dot={{ r: 4 }} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
