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
    sm: { icon: "h-20 w-20", title: "text-xl", sub: "text-[10px]" },
    md: { icon: "h-24 w-24", title: "text-2xl", sub: "text-xs" },
    lg: { icon: "h-28 w-28", title: "text-3xl", sub: "text-sm" },
  }[size];

  const content = (
    <div className="flex items-center gap-3">
      <div className={`relative flex ${sizeClasses.icon} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F2E8D8] shadow-md shadow-[#33291F]/22 ring-2 ring-[#B96832]/80`}>
        <img src="/assets/image.png" alt="" aria-hidden="true" className="h-full w-auto max-w-none object-center" />
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
