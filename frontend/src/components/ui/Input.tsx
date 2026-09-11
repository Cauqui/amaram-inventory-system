export function Input({ label, value, onChange, type = "text", placeholder = "", readOnly = false, required = false }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; placeholder?: string; readOnly?: boolean; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">
        {label}{required && <span className="text-[#C62828] ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value} readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`border border-[#E2DDD7] rounded px-3 py-2 text-sm text-[#1A1A1A] outline-none transition-all ${readOnly ? "bg-[#F5F3F0] text-[#6B6560] font-mono" : "bg-white focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/10"}`}
      />
    </div>
  );
}
