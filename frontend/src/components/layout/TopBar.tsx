import { createContext, useContext, type ReactNode } from "react";
import { Icon } from "../ui/Icon";
import { Icons } from "../ui/icons";

export const MobileNavigationContext = createContext<(() => void) | null>(null);

export function TopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  const openMobileNavigation = useContext(MobileNavigationContext);
  return <div className="flex flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between border-b border-[#E2DDD7] bg-white flex-shrink-0"><div className="flex min-w-0 items-start gap-3">{openMobileNavigation && <button type="button" onClick={openMobileNavigation} aria-label="Abrir menú" className="md:hidden mt-0.5 p-2 -ml-2 rounded text-[#6B6560] hover:bg-[#F5F3F0]"><Icon path={Icons.menu} size={20} /></button>}<div className="min-w-0"><h2 className="text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>{subtitle && <p className="text-xs text-[#6B6560] mt-0.5">{subtitle}</p>}</div></div>{actions && <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>}</div>;
}
