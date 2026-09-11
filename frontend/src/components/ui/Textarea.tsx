export function Textarea({ label, value, onChange, placeholder = "", rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="border border-[#E2DDD7] rounded px-3 py-2 text-sm text-[#1A1A1A] bg-white outline-none focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/10 transition-all resize-none" />
    </div>
  );
}
