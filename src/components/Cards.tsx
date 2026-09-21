import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({ label, value, helper, icon: Icon, symbol }: { label: string; value: string; helper?: string; icon: LucideIcon; symbol?: ReactNode }) {
  return (
    <div className="rounded-md border border-[#D8CDBB] bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#765536]">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-ink">{value}</p>
          {helper && <p className="mt-1 text-xs text-[#765536]">{helper}</p>}
        </div>
        {symbol ?? <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#E9E1D2] text-[#B96832]"><Icon size={20} /></span>}
      </div>
    </div>
  );
}

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-[#765536]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
