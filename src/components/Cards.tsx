import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper?: string; icon: LucideIcon }) {
  return (
    <div className="rounded-md border border-field/10 bg-white/90 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink/60">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-ink">{value}</p>
          {helper && <p className="mt-1 text-xs text-ink/55">{helper}</p>}
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-leaf/10 text-field"><Icon size={20} /></span>
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
          {subtitle && <p className="text-sm text-ink/60">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
