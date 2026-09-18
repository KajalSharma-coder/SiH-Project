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
      <div className={`relative flex ${sizeClasses.icon} shrink-0 items-center justify-center rounded-full bg-[#555633] text-[#F4EFE4] shadow-md shadow-[#33291F]/15 ring-2 ring-[#B96832]/50`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3/5 w-3/5">
          <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" className="fill-[#F4EFE4]/15" />
          <path d="M12 22V12" />
          <path d="M12 12C12 7.5 7.5 6 7.5 6S6 10.5 12 12z" fill="currentColor" className="opacity-90" />
          <path d="M12 12C12 7.5 16.5 6 16.5 6S18 10.5 12 12z" fill="currentColor" className="opacity-90" />
        </svg>
      </div>
      <div>
        <span className={`block font-black tracking-tight ${isDark ? "text-[#F4EFE4]" : "text-[#33291F]"} ${sizeClasses.title}`}>
          Fair<span className={isDark ? "text-[#E1B083]" : "text-[#765536]"}>Trade</span>
        </span>
        {showSubtitle && (
          <span className={`block font-medium ${isDark ? "text-[#E9E1D2]/80" : "text-[#765536]"} ${sizeClasses.sub}`}>
            Trusted Mandi Platform
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
