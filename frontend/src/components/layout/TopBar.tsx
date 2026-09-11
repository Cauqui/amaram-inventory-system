import type { ReactNode } from "react";

export function TopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD7] bg-white flex-shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
        {subtitle && <p className="text-xs text-[#6B6560] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
