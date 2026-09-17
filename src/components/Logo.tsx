import { Link } from "react-router-dom";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showSubtitle?: boolean;
  clickable?: boolean;
};

export function FairTradeLogo({ size = "md", variant = "light", showSubtitle = true, clickable = true }: LogoProps) {
  const isDark = variant === "dark";

  const sizeClasses = {
    sm: { icon: "h-8 w-8", title: "text-base", sub: "text-[10px]" },
    md: { icon: "h-10 w-10", title: "text-lg", sub: "text-xs" },
    lg: { icon: "h-12 w-12", title: "text-2xl", sub: "text-xs" },
  }[size];

  const content = (
    <div className="flex items-center gap-3">
      <div className={`relative flex ${sizeClasses.icon} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f7d4d] to-[#1e5631] text-white shadow-md shadow-emerald-900/10 ring-1 ring-white/20`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3/5 w-3/5">
          {/* Sprout / Leaf & Handshake motif */}
          <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" className="opacity-20 fill-white" />
          <path d="M12 22V12" />
          <path d="M12 12C12 7.5 7.5 6 7.5 6S6 10.5 12 12z" fill="currentColor" className="opacity-90" />
          <path d="M12 12C12 7.5 16.5 6 16.5 6S18 10.5 12 12z" fill="currentColor" className="opacity-90" />
        </svg>
      </div>
      <div>
        <span className={`block font-black tracking-tight ${isDark ? "text-white" : "text-[#17312a]"} ${sizeClasses.title}`}>
          Fair<span className="text-[#2f7d4d]">Trade</span>
        </span>
        {showSubtitle && (
          <span className={`block font-medium ${isDark ? "text-emerald-200/80" : "text-emerald-950/60"} ${sizeClasses.sub}`}>
            Mandi Marketplace
          </span>
        )}
      </div>
    </div>
  );

  if (clickable) {
    return <Link to="/" className="inline-block transition opacity-95 hover:opacity-100">{content}</Link>;
  }

  return content;
}
