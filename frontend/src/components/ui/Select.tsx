export function Select({ label, value, onChange, options, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">
        {label}{required && <span className="text-[#C62828] ml-0.5">*</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="border border-[#E2DDD7] rounded px-3 py-2 text-sm text-[#1A1A1A] bg-white outline-none focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/10 transition-all">
        <option value="">— Seleccionar —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
