import { Icon } from "./Icon";

export function StatCard({ label, value, color = "default", icon }: { label: string; value: string | number; color?: string; icon: string }) {
  const colors = {
    default: "border-[#E2DDD7]",
    success: "border-l-4 border-l-[#2E7D32]",
    warning: "border-l-4 border-l-[#C4813A]",
    danger: "border-l-4 border-l-[#C62828]",
    primary: "border-l-4 border-l-[#2D6A6A]",
  } as Record<string, string>;
  return (
    <div className={`bg-white rounded-lg p-4 border ${colors[color] || colors.default} shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#6B6560] uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
        </div>
        <div className="p-2 bg-[#F5F3F0] rounded-lg text-[#6B6560]"><Icon path={icon} size={18} /></div>
      </div>
    </div>
  );
}
