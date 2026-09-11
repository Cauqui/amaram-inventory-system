import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import {
  ApiError, authApi, categoriesApi, dashboardApi, inventoryMovementsApi, productImagesApi, productsApi, productVariantsApi, programsApi, reportsApi,
  type ApiCategory, type ApiDashboard, type ApiInventoryMovement, type ApiProduct, type ApiProductVariant,
  type ApiInventoryReport, type ApiProductImage, type ApiProgram, type AuthenticatedUser, type InventoryMovementType, type ProductVariantInput,
} from "./lib/api";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ path, size = 16, className = "" }: { path: string; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={path} />
  </svg>
);
const Icons = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  inventory: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16",
  products: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0",
  categories: "M4 6h16M4 12h8m-8 6h16",
  programs: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100 8 4 4 0 000-8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  movements: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  reports: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  stock: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  history: "M3 12a9 9 0 109 9 9 9 0 00-9-9z M12 7v5l3 3",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  x: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  chevronRight: "M9 18l6-6-6-6",
  upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  package: "M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z M12 22V9 M22 8.5l-10 6.5-10-6.5",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  arrowDown: "M12 5v14M19 12l-7 7-7-7",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  back: "M19 12H5M12 19l-7-7 7-7",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | "login" | "dashboard" | "inventory" | "product-new" | "product-edit"
  | "product-detail" | "categories" | "programs" | "movements"
  | "movement-new" | "reports" | "settings";

type NavItem = { id: Screen; label: string; icon: string; available: boolean };

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Icons.dashboard, available: true },
  { id: "inventory", label: "Inventario", icon: Icons.inventory, available: true },
  { id: "product-new", label: "Productos", icon: Icons.products, available: true },
  { id: "categories", label: "Categorías", icon: Icons.categories, available: true },
  { id: "programs", label: "Programas / Talleres", icon: Icons.programs, available: true },
  { id: "movements", label: "Movimientos", icon: Icons.movements, available: true },
  { id: "reports", label: "Reportes", icon: Icons.reports, available: true },
  { id: "settings", label: "Configuración", icon: Icons.settings, available: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatusLabel(status: StockVisualStatus) {
  return { available: "Disponible", low_stock: "Stock bajo", out_of_stock: "Sin stock", inactive: "Inactivo" }[status];
}
function getStatusColor(status: StockVisualStatus) {
  return {
    available: "bg-[#E8F5E9] text-[#2E7D32]",
    low_stock: "bg-[#FDF3E7] text-[#C4813A]",
    out_of_stock: "bg-[#FFEBEE] text-[#C62828]",
    inactive: "bg-gray-100 text-gray-500",
  }[status];
}
// ─── Shared UI ────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>;
}

function Btn({
  children, onClick, variant = "primary", size = "md", disabled = false, className = "",
}: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; disabled?: boolean; className?: string;
}) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded transition-all cursor-pointer select-none";
  const sizes = { sm: "px-2.5 py-1 text-xs", md: "px-3.5 py-1.5 text-sm" };
  const variants = {
    primary: "bg-[#2D6A6A] text-white hover:bg-[#245757] active:scale-95",
    secondary: "bg-white text-[#1A1A1A] border border-[#E2DDD7] hover:bg-[#F5F3F0] active:scale-95",
    ghost: "text-[#6B6560] hover:bg-[#F5F3F0] hover:text-[#1A1A1A] active:scale-95",
    danger: "bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2] active:scale-95",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "", readOnly = false, required = false }: {
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

function Select({ label, value, onChange, options, required = false }: {
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

function Textarea({ label, value, onChange, placeholder = "", rows = 3 }: {
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

function Modal({ title, onClose, children, width = "max-w-xl" }: {
  title: string; onClose: () => void; children: React.ReactNode; width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-2xl w-full ${width} mx-4 max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD7]">
          <h3 className="font-semibold text-[#1A1A1A] text-base">{title}</h3>
          <button onClick={onClose} className="text-[#6B6560] hover:text-[#1A1A1A] transition-colors"><Icon path={Icons.x} size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-2 ${type === "success" ? "bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]" : "bg-[#FFEBEE] border-[#C62828] text-[#C62828]"}`}>
      <Icon path={type === "success" ? Icons.check : Icons.alert} size={16} />
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><Icon path={Icons.x} size={14} /></button>
    </div>
  );
}

function StatCard({ label, value, color = "default", icon }: { label: string; value: string | number; color?: string; icon: string }) {
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ currentScreen, onNavigate, currentUser, onLogout }: {
  currentScreen: Screen; onNavigate: (s: Screen) => void; currentUser: AuthenticatedUser; onLogout: () => void;
}) {
  const mainNav = NAV_ITEMS.filter(i => i.id !== "settings");
  const settingsItem = NAV_ITEMS.find(i => i.id === "settings")!;
  const isActive = (id: Screen) => {
    if (id === "product-new") return ["product-new", "product-edit", "product-detail"].includes(currentScreen);
    return currentScreen === id;
  };

  return (
    <aside className="w-56 flex-shrink-0 h-screen flex flex-col bg-[#1B2B2D] text-white overflow-hidden">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>AMARAM</h1>
        <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Sistema de Gestión<br />de Inventario</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {mainNav.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id as Screen)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all text-left ${isActive(item.id) ? "bg-[#2D6A6A] text-white font-medium" : "text-white/70 hover:bg-white/8 hover:text-white"}`}>
            <Icon path={item.icon} size={15} className="flex-shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        <button onClick={() => onNavigate(settingsItem.id as Screen)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all text-left ${currentScreen === "settings" ? "bg-[#2D6A6A] text-white font-medium" : "text-white/70 hover:bg-white/8 hover:text-white"}`}>
          <Icon path={settingsItem.icon} size={15} />
          <span>{settingsItem.label}</span>
        </button>
        <div className="flex items-center gap-2 px-3 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-[#2D6A6A] flex items-center justify-center text-xs font-bold flex-shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-white/50 capitalize">{currentUser.role === "ADMIN" ? "Administrador" : "Inventario"}</p>
          </div>
          <button onClick={onLogout} className="text-white/40 hover:text-white transition-colors"><Icon path={Icons.logout} size={14} /></button>
        </div>
      </div>
    </aside>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
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

// ─── Product Photo ────────────────────────────────────────────────────────────
function ProductPhoto({ src, alt, size = 32 }: { src?: string; alt: string; size?: number }) {
  if (!src) {
    return <div aria-label={`Sin imagen: ${alt}`} className="rounded bg-[#F5F3F0] flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}><Icon path={Icons.package} size={Math.max(13, Math.round(size * 0.48))} className="text-[#6B6560]" /></div>;
  }
  return <img src={src} alt={alt} width={size} height={size} className="rounded object-cover bg-[#F5F3F0] flex-shrink-0" style={{ width: size, height: size }} />;
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: AuthenticatedUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const { user } = await authApi.login(email, password);
      onLogin(user);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError && requestError.status === 401
          ? "Correo o contraseña incorrectos."
          : "No se pudo iniciar sesión. Inténtalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#1B2B2D] text-white mb-4">
            <Icon path={Icons.package} size={24} />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>AMARAM</h1>
          <p className="text-sm text-[#6B6560] mt-1">Sistema de Gestión de Inventario</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E2DDD7] p-6">
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-5">Iniciar sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">Usuario o correo</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@amaram.org"
                className="border border-[#E2DDD7] rounded px-3 py-2 text-sm outline-none focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/10 transition-all" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">Contraseña</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full border border-[#E2DDD7] rounded px-3 py-2 text-sm outline-none focus:border-[#2D6A6A] focus:ring-2 focus:ring-[#2D6A6A]/10 transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1A1A1A]">
                  <Icon path={Icons.eye} size={15} />
                </button>
              </div>
              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} className="accent-[#2D6A6A]" />
                <span className="text-xs text-[#6B6560]">Mostrar contraseña</span>
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-[#FFEBEE] border border-[#FFCDD2] rounded px-3 py-2.5 text-xs text-[#C62828]">
                <Icon path={Icons.alert} size={14} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full bg-[#2D6A6A] text-white py-2.5 rounded text-sm font-medium hover:bg-[#245757] transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#E2DDD7]">
            <p className="text-[10px] text-[#6B6560] text-center">Ingresa tus credenciales de acceso.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#1B2B2D] text-white mb-4">
          <Icon path={Icons.package} size={24} />
        </div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>AMARAM</h1>
        <p className="text-sm text-[#6B6560] mt-2">Comprobando sesión...</p>
      </div>
    </div>
  );
}

type StockVisualStatus = "available" | "low_stock" | "out_of_stock" | "inactive";
type ProductVisualStatus = StockVisualStatus;
type VariantDraft = ProductVariantInput & { key: number };

function apiMessage(error: unknown, fallback: string, onUnauthorized: () => void) {
  if (error instanceof ApiError && error.status === 401) {
    onUnauthorized();
    return "La sesión expiró. Inicia sesión nuevamente.";
  }
  if (error instanceof ApiError && error.status === 409) return "La variante ya existe o su SKU está en uso.";
  if (error instanceof ApiError && error.status === 404) return "El recurso solicitado ya no existe.";
  return fallback;
}

function variantVisualStatus(variant: ApiProductVariant): ProductVisualStatus {
  if (!variant.active) return "inactive";
  if (variant.stock === 0) return "out_of_stock";
  if (variant.stock <= variant.minimumStock) return "low_stock";
  return "available";
}

function productVisualStatus(product: ApiProduct): ProductVisualStatus {
  if (!product.active) return "inactive";
  const statuses = product.variants.filter((variant) => variant.active).map(variantVisualStatus);
  if (!statuses.length || statuses.every((status) => status === "out_of_stock")) return "out_of_stock";
  if (statuses.some((status) => status === "low_stock" || status === "out_of_stock")) return "low_stock";
  return "available";
}

function RealInventoryScreen({ onNavigate, onUnauthorized }: {
  onNavigate: (screen: Screen, data?: unknown) => void; onUnauthorized: () => void;
}) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [programId, setProgramId] = useState("");
  const [status, setStatus] = useState("");
  const [color, setColor] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [productResult, categoryResult, programResult] = await Promise.all([
        productsApi.list({ search: search.trim() || undefined, categoryId: categoryId || undefined, programId: programId || undefined, active: status === "inactive" ? false : undefined }),
        categoriesApi.list(), programsApi.list(),
      ]);
      setProducts(productResult.products); setCategories(categoryResult.categories); setPrograms(programResult.programs);
    } catch (requestError) { setError(apiMessage(requestError, "No se pudieron cargar los productos.", onUnauthorized)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [search, categoryId, programId, status]);
  const filtered = products.filter((product) => {
    const matchesStatus = !status || productVisualStatus(product) === status;
    const matchesColor = !color || product.variants.some((variant) => variant.color?.toLowerCase().includes(color.toLowerCase()));
    return matchesStatus && matchesColor;
  });

  return <div className="flex-1 flex flex-col overflow-hidden">
    <TopBar title="Inventario" subtitle={`${products.length} productos registrados`} actions={<div className="flex gap-2"><Btn variant="secondary" size="sm" onClick={() => void load()}>Recargar</Btn><Btn onClick={() => onNavigate("product-new")} variant="primary" size="sm"><Icon path={Icons.plus} size={14} />Nuevo producto</Btn></div>} />
    <div className="px-6 py-3 border-b border-[#E2DDD7] bg-white flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-48"><Icon path={Icons.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6560]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, SKU, creadora..." className="w-full pl-8 pr-3 py-1.5 border border-[#E2DDD7] rounded text-sm outline-none focus:border-[#2D6A6A] transition-all bg-[#F5F3F0]" /></div>
      <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm text-[#6B6560] bg-[#F5F3F0]"><option value="">Categoría</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select value={programId} onChange={(event) => setProgramId(event.target.value)} className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm text-[#6B6560] bg-[#F5F3F0]"><option value="">Programa</option>{programs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select value={status} onChange={(event) => setStatus(event.target.value)} className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm text-[#6B6560] bg-[#F5F3F0]"><option value="">Estado</option><option value="available">Disponible</option><option value="low_stock">Stock bajo</option><option value="out_of_stock">Sin stock</option><option value="inactive">Inactivo</option></select>
      <input value={color} onChange={(event) => setColor(event.target.value)} placeholder="Color" className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm text-[#6B6560] bg-[#F5F3F0] w-24" />
      {(search || categoryId || programId || status || color) && <Btn variant="ghost" size="sm" onClick={() => { setSearch(""); setCategoryId(""); setProgramId(""); setStatus(""); setColor(""); }}>Limpiar</Btn>}
    </div>
    <div className="flex-1 overflow-y-auto"><table className="w-full text-sm border-collapse"><thead className="bg-[#F5F3F0] sticky top-0 z-10"><tr>{["Foto", "SKU", "Producto", "Categoría", "Talla", "Color", "Programa/Taller", "Creadora", "Stock", "Estado", "Acciones"].map((header) => <th key={header} className="text-left px-4 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">
      {loading && <tr><td colSpan={11} className="text-center py-12 text-[#6B6560] text-sm">Cargando productos...</td></tr>}
      {!loading && error && <tr><td colSpan={11} className="text-center py-12 text-[#C62828] text-sm">{error}</td></tr>}
      {!loading && !error && filtered.length === 0 && <tr><td colSpan={11} className="text-center py-12 text-[#6B6560] text-sm">No se encontraron productos</td></tr>}
      {!loading && !error && filtered.map((product) => { const visualStatus = productVisualStatus(product); const stock = product.variants.reduce((sum, variant) => sum + variant.stock, 0); return <tr key={product.id} className="hover:bg-[#F5F3F0] transition-colors bg-white"><td className="px-4 py-2.5"><ProductPhoto src={product.images[0]?.secureUrl} alt={product.name} size={32} /></td><td className="px-4 py-2.5 font-mono text-xs text-[#6B6560]">{product.skuBase}</td><td className="px-4 py-2.5"><p className="font-medium text-[#1A1A1A] text-xs">{product.name}</p>{product.variants.length > 1 && <p className="text-[10px] text-[#6B6560]">{product.variants.length} variantes</p>}</td><td className="px-4 py-2.5 text-xs text-[#6B6560]">{product.category.name}</td><td className="px-4 py-2.5 text-xs text-[#6B6560]">{product.category.usesSizes ? [...new Set(product.variants.map((variant) => variant.size).filter(Boolean))].join(", ") : "—"}</td><td className="px-4 py-2.5 text-xs text-[#6B6560]">{[...new Set(product.variants.map((variant) => variant.color).filter(Boolean))].join(", ") || "—"}</td><td className="px-4 py-2.5 text-xs text-[#6B6560]">{product.program.name}</td><td className="px-4 py-2.5 text-xs text-[#6B6560]">{product.creatorName}</td><td className="px-4 py-2.5 text-xs font-semibold text-[#1A1A1A]">{stock}</td><td className="px-4 py-2.5"><Badge label={getStatusLabel(visualStatus)} color={getStatusColor(visualStatus)} /></td><td className="px-4 py-2.5"><div className="flex items-center gap-1"><Btn variant="ghost" size="sm" onClick={() => onNavigate("product-detail", product)} className="!px-2"><Icon path={Icons.eye} size={13} /></Btn><Btn variant="ghost" size="sm" onClick={() => onNavigate("product-edit", product)} className="!px-2"><Icon path={Icons.edit} size={13} /></Btn></div></td></tr>; })}
    </tbody></table></div><div className="px-6 py-2 border-t border-[#E2DDD7] bg-white text-xs text-[#6B6560]">Mostrando {filtered.length} de {products.length} productos</div>
  </div>;
}

function RealProductFormScreen({ editProduct, onSaved, onNavigate, onUnauthorized }: {
  editProduct?: ApiProduct; onSaved: (product: ApiProduct) => void; onNavigate: (screen: Screen) => void; onUnauthorized: () => void;
}) {
  const isEdit = !!editProduct;
  const [categories, setCategories] = useState<ApiCategory[]>([]); const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [name, setName] = useState(editProduct?.name || ""); const [description, setDescription] = useState(editProduct?.description || ""); const [history, setHistory] = useState(editProduct?.history || ""); const [creatorName, setCreatorName] = useState(editProduct?.creatorName || "");
  const [categoryId, setCategoryId] = useState(editProduct?.category.id || ""); const [programId, setProgramId] = useState(editProduct?.program.id || ""); const [active, setActive] = useState(editProduct?.active ?? true);
  const [variants, setVariants] = useState<VariantDraft[]>([{ key: 1, size: null, color: null, minimumStock: 0 }]); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { Promise.all([categoriesApi.list(), programsApi.list()]).then(([a, b]) => { setCategories(a.categories); setPrograms(b.programs); }).catch((requestError) => setError(apiMessage(requestError, "No se pudieron cargar los catálogos.", onUnauthorized))); }, []);
  const selectedCategory = categories.find((category) => category.id === categoryId) || editProduct?.category;
  const updateVariant = (key: number, changes: Partial<VariantDraft>) => setVariants((items) => items.map((item) => item.key === key ? { ...item, ...changes } : item));
  const submit = async () => {
    setError("");
    const normalized = variants.map(({ size, color, minimumStock }) => ({ size: selectedCategory?.usesSizes ? size?.trim() || null : null, color: color?.trim() || null, minimumStock }));
    const duplicateKeys = normalized.map((variant) => `${variant.size?.trim().toUpperCase() || "UNI"}:${variant.color?.trim().toUpperCase() || "STD"}`);
    if (!name.trim() || !description.trim() || !creatorName.trim() || !programId || (!isEdit && !categoryId)) return setError("Completa los campos obligatorios.");
    if (!isEdit && selectedCategory?.usesSizes && normalized.some((variant) => !variant.size)) return setError("La talla es obligatoria para esta categoría.");
    if (!isEdit && new Set(duplicateKeys).size !== duplicateKeys.length) return setError("Hay variantes duplicadas.");
    setSaving(true);
    try {
      const result = isEdit
        ? await productsApi.update(editProduct.id, { name, description, history: history.trim() || null, programId, creatorName, active })
        : await productsApi.create({ name, description, history: history.trim() || null, categoryId, programId, creatorName, variants: normalized });
      onSaved(result.product);
    } catch (requestError) { setError(apiMessage(requestError, "No se pudo guardar el producto.", onUnauthorized)); }
    finally { setSaving(false); }
  };
  const availableCategories = categories.filter((item) => item.active || item.id === categoryId); const availablePrograms = programs.filter((item) => item.active || item.id === programId);
  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title={isEdit ? "Editar producto" : "Nuevo producto"} subtitle={isEdit ? editProduct.name : "Registro de nuevo producto"} actions={<div className="flex gap-2"><Btn variant="secondary" onClick={() => onNavigate("inventory")}>Cancelar</Btn><Btn variant="primary" onClick={() => void submit()}><Icon path={Icons.check} size={14} />{saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar producto"}</Btn></div>} />
    <div className="flex-1 overflow-y-auto p-6"><div className="max-w-3xl mx-auto space-y-6">
      {error && <div className="bg-[#FFEBEE] border border-[#C62828] text-[#C62828] rounded px-4 py-3 text-sm">{error}</div>}
      <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm"><div className="px-5 py-4 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Información básica</h3></div><div className="p-5 grid grid-cols-2 gap-4"><div className="col-span-2"><Input label="Nombre del producto" value={name} onChange={setName} required /></div>
        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">Categoría *</label><select disabled={isEdit} value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setVariants((items) => items.map((item) => ({ ...item, size: null }))); }} className="border border-[#E2DDD7] rounded px-3 py-2 text-sm bg-white disabled:bg-[#F5F3F0] disabled:text-[#6B6560]"><option value="">— Seleccionar —</option>{availableCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{isEdit && <span className="text-[10px] text-[#6B6560]">La categoría no puede cambiarse después de generar el SKU.</span>}</div>
        <Select label="Programa / Taller" value={programId} onChange={setProgramId} required options={availablePrograms.map((item) => ({ value: item.id, label: item.name }))} /><div className="col-span-2"><Input label="Creadora / Diseñadora" value={creatorName} onChange={setCreatorName} required /></div><div className="col-span-2"><Textarea label="Descripción del producto" value={description} onChange={setDescription} rows={2} /></div><div className="col-span-2"><Textarea label="Historia del producto" value={history} onChange={setHistory} rows={3} /></div>{isEdit && <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="accent-[#2D6A6A]" />Producto activo</label>}</div></div>
      <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm"><div className="px-5 py-4 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Fotografía del producto</h3></div><div className="p-5 flex items-center gap-5"><div className="w-28 h-28 rounded-lg border-2 border-dashed border-[#E2DDD7] bg-[#F5F3F0] flex items-center justify-center"><Icon path={Icons.package} size={24} className="text-[#6B6560]" /></div><p className="text-xs text-[#6B6560]">Después de registrar el producto, gestiona sus fotografías desde el detalle.</p></div></div>
      {!isEdit && <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm"><div className="px-5 py-4 border-b border-[#E2DDD7] flex justify-between"><div><h3 className="text-sm font-semibold text-[#1A1A1A]">Variantes {selectedCategory?.usesSizes ? "(talla + color)" : "(color)"}</h3><p className="text-[10px] text-[#6B6560] mt-0.5">El backend genera el SKU; el stock inicial será 0</p></div><Btn variant="secondary" size="sm" onClick={() => setVariants((items) => [...items, { key: Date.now(), size: null, color: null, minimumStock: 0 }])}><Icon path={Icons.plus} size={13} />Agregar variante</Btn></div><div className="p-5 space-y-3">{variants.map((variant) => <div key={variant.key} className="grid gap-3 p-3 bg-[#F5F3F0] rounded-lg border border-[#E2DDD7]" style={{ gridTemplateColumns: selectedCategory?.usesSizes ? "1fr 1fr 1fr 1fr auto" : "1fr 1fr 1fr auto" }}><div><label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">SKU</label><div className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs font-mono text-[#6B6560] bg-white">Generado al guardar</div></div>{selectedCategory?.usesSizes && <div><label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Talla</label><input value={variant.size || ""} onChange={(event) => updateVariant(variant.key, { size: event.target.value })} className="w-full border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs bg-white" /></div>}<div><label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Color</label><input value={variant.color || ""} onChange={(event) => updateVariant(variant.key, { color: event.target.value })} className="w-full border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs bg-white" /></div><div><label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Stock mínimo</label><input type="number" min={0} value={variant.minimumStock} onChange={(event) => updateVariant(variant.key, { minimumStock: Number(event.target.value) })} className="w-full border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs bg-white" /></div><div className="flex items-end">{variants.length > 1 && <button onClick={() => setVariants((items) => items.filter((item) => item.key !== variant.key))} className="p-1.5 text-[#C62828] hover:bg-[#FFEBEE] rounded"><Icon path={Icons.x} size={14} /></button>}</div></div>)}</div></div>}
    </div></div>
  </div>;
}

function productImageMessage(error: unknown, onUnauthorized: () => void) {
  if (error instanceof ApiError && error.status === 401) {
    onUnauthorized();
    return "La sesión expiró. Inicia sesión nuevamente.";
  }
  if (error instanceof ApiError && error.status === 400) return "Selecciona una imagen JPG, PNG o WebP válida.";
  if (error instanceof ApiError && error.status === 403) return "No tienes permiso para gestionar imágenes.";
  if (error instanceof ApiError && error.status === 404) return "El producto o la imagen ya no existe.";
  if (error instanceof ApiError && error.status === 409) return "El producto está inactivo o ya tiene el máximo de 5 imágenes.";
  if (error instanceof ApiError && error.status === 413) return "La imagen no puede superar 5 MB.";
  return "No se pudo completar la operación con la imagen.";
}

function ProductImageGallery({ product, onUnauthorized }: { product: ApiProduct; onUnauthorized: () => void }) {
  const initialImages = () => product.images.map((image) => ({ ...image, productId: product.id }));
  const [images, setImages] = useState<ApiProductImage[]>(() => initialImages().sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)));
  const [selectedId, setSelectedId] = useState<string | null>(product.images[0]?.id ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const setImageList = (next: ApiProductImage[], preferredId?: string | null) => {
    const ordered = [...next].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
    setImages(ordered);
    setSelectedId((current) => preferredId && ordered.some((image) => image.id === preferredId)
      ? preferredId
      : ordered.some((image) => image.id === current) ? current : ordered[0]?.id ?? null);
  };
  const refresh = async (preferredId?: string | null) => {
    const result = await productImagesApi.list(product.id);
    setImageList(result.images, preferredId);
  };
  useEffect(() => { void refresh().catch((requestError) => setError(productImageMessage(requestError, onUnauthorized))); }, [product.id]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const selectFile = (file: File | undefined) => {
    setError(""); setNotice("");
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError("Selecciona una imagen JPG, PNG o WebP.");
    if (file.size > 5 * 1024 * 1024) return setError("La imagen no puede superar 5 MB.");
    if (images.length >= 5) return setError("Este producto ya tiene el máximo de 5 imágenes.");
    setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file));
  };
  const clearSelection = () => {
    setSelectedFile(null); setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };
  const upload = async () => {
    if (!selectedFile || loading || !product.active) return;
    setLoading(true); setError(""); setNotice("");
    try {
      const result = await productImagesApi.upload(product.id, selectedFile);
      await refresh(result.image.id);
      clearSelection();
      setNotice("Imagen subida correctamente.");
    } catch (requestError) { setError(productImageMessage(requestError, onUnauthorized)); }
    finally { setLoading(false); }
  };
  const remove = async () => {
    const selected = images.find((image) => image.id === selectedId);
    if (!selected || removingId) return;
    if (!window.confirm("¿Eliminar esta imagen del producto?")) return;
    setRemovingId(selected.id); setError(""); setNotice("");
    try {
      await productImagesApi.remove(product.id, selected.id);
      await refresh();
      setNotice("Imagen eliminada correctamente.");
    } catch (requestError) { setError(productImageMessage(requestError, onUnauthorized)); }
    finally { setRemovingId(null); }
  };

  const selected = images.find((image) => image.id === selectedId) ?? images[0];
  const visibleUrl = previewUrl ?? selected?.secureUrl;
  return <div className="bg-white rounded-lg border border-[#E2DDD7] p-4 shadow-sm flex flex-col gap-3"><div className="w-full aspect-square rounded-lg bg-[#F5F3F0] overflow-hidden flex items-center justify-center">{visibleUrl ? <img src={visibleUrl} alt={selectedFile ? `Vista previa de ${selectedFile.name}` : product.name} className="w-full h-full object-cover" /> : <Icon path={Icons.package} size={32} className="text-[#6B6560]" />}</div>
    {images.length > 0 && <div className="grid grid-cols-5 gap-1.5">{images.map((image) => <button key={image.id} type="button" aria-label={`Ver imagen ${image.position} de ${product.name}`} onClick={() => { setSelectedId(image.id); setPreviewUrl(null); }} className={`aspect-square rounded border overflow-hidden ${selected?.id === image.id && !previewUrl ? "border-[#2D6A6A] ring-2 ring-[#2D6A6A]/20" : "border-[#E2DDD7]"}`}><img src={image.secureUrl} alt={`${product.name}, imagen ${image.position}`} className="w-full h-full object-cover" /></button>)}</div>}
    <p className="text-[10px] text-[#6B6560] text-center">{images.length}/5 imágenes</p>
    {error && <p className="text-[10px] text-[#C62828]">{error}</p>}{notice && <p className="text-[10px] text-[#2E7D32]">{notice}</p>}
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} disabled={!product.active || loading || !!removingId || images.length >= 5} />
    {selectedFile ? <div className="space-y-2"><p className="text-[10px] text-[#6B6560] truncate" title={selectedFile.name}>{selectedFile.name}</p><div className="flex gap-2"><Btn variant="secondary" size="sm" disabled={loading} onClick={clearSelection}>Cancelar</Btn><Btn variant="primary" size="sm" disabled={loading} onClick={() => void upload()}><Icon path={Icons.upload} size={13} />{loading ? "Subiendo..." : "Subir imagen"}</Btn></div></div> : <Btn variant="secondary" size="sm" disabled={!product.active || loading || !!removingId || images.length >= 5} onClick={() => inputRef.current?.click()}><Icon path={Icons.upload} size={13} />Agregar imagen</Btn>}
    {selected && !selectedFile && <Btn variant="danger" size="sm" disabled={!!removingId || loading} onClick={() => void remove()}><Icon path={Icons.x} size={13} />{removingId ? "Eliminando..." : "Eliminar imagen"}</Btn>}
    {!product.active && <p className="text-[10px] text-[#6B6560] text-center">Activa el producto para agregar imágenes.</p>}
  </div>;
}

function BarcodeSvg({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    JsBarcode(ref.current, value, {
      format: "CODE128",
      displayValue: false,
      lineColor: "#1A1A1A",
      background: "#FFFFFF",
      margin: 4,
      width: 0.75,
      height: 36,
    });
  }, [value]);

  return <svg ref={ref} role="img" aria-label={`Código de barras ${value}`} className="w-full max-w-full h-auto" />;
}

function LabelArtwork({ product, variant, preview = false }: { product: ApiProduct; variant: ApiProductVariant; preview?: boolean }) {
  const detail = [variant.color, product.category.usesSizes ? variant.size : null].filter(Boolean).join(" · ");
  return <article className={`product-label${preview ? " label-preview" : ""}`}>
    <section className="label-main-column">
      <header className="label-brand"><span className="label-brand-name">AMARAM</span><span className="label-slogan">TEJIENDO UN FUTURO MÁS BRILLANTE</span></header>
      <div className="label-product-copy"><h4>{product.name}</h4>{detail && <p>{detail}</p>}<span>{product.category.name.replace(/s$/i, "")} artesanal</span></div>
      <div className="label-barcode"><BarcodeSvg value={variant.sku} /></div>
      <p className="label-sku">{variant.sku}</p>
    </section>
    <aside className="label-side-column"><div className="label-symbol" aria-label="AMARAM">AM</div><p className="label-values">ARTESANÍA<br />COMUNIDAD<br />OPORTUNIDAD</p><div className="label-qr-reserve" aria-hidden="true" /><p className="label-history">CONOCE<br />NUESTRA HISTORIA</p></aside>
  </article>;
}

function ProductVariantLabel({ product, variant, copies }: { product: ApiProduct; variant: ApiProductVariant; copies: number }) {
  return <div className="label-print-sheet" aria-hidden="true">
    {Array.from({ length: copies }, (_, index) => <LabelArtwork key={index} product={product} variant={variant} />)}
  </div>;
}

function RealProductDetailScreen({ productId, onNavigate, onUnauthorized }: { productId: string; onNavigate: (screen: Screen, data?: unknown) => void; onUnauthorized: () => void }) {
  const [product, setProduct] = useState<ApiProduct | null>(null); const [error, setError] = useState(""); const [variantModal, setVariantModal] = useState(false); const [editing, setEditing] = useState<ApiProductVariant | null>(null); const [variant, setVariant] = useState<ProductVariantInput>({ size: null, color: null, minimumStock: 0 }); const [variantActive, setVariantActive] = useState(true); const [labelVariant, setLabelVariant] = useState<ApiProductVariant | null>(null); const [labelCopies, setLabelCopies] = useState("1"); const [labelError, setLabelError] = useState("");
  const load = async () => { try { const result = await productsApi.get(productId); setProduct(result.product); } catch (requestError) { setError(apiMessage(requestError, "No se pudo cargar el producto.", onUnauthorized)); } };
  useEffect(() => { void load(); }, [productId]);
  const openNew = () => { setEditing(null); setVariant({ size: null, color: null, minimumStock: 0 }); setVariantActive(true); setVariantModal(true); };
  const openEdit = (item: ApiProductVariant) => { setEditing(item); setVariant({ size: item.size, color: item.color, minimumStock: item.minimumStock }); setVariantActive(item.active); setVariantModal(true); };
  const openLabel = (item: ApiProductVariant) => { setLabelVariant(item); setLabelCopies("1"); setLabelError(""); };
  const printableCopies = Number(labelCopies);
  const printLabels = () => {
    if (!Number.isInteger(printableCopies) || printableCopies < 1 || printableCopies > 100) return setLabelError("Ingresa entre 1 y 100 etiquetas.");
    setLabelError("");
    window.print();
  };
  const saveVariant = async () => { if (!product) return; setError(""); try { if (editing) await productsApi.updateVariant(product.id, editing.id, { minimumStock: variant.minimumStock, active: variantActive }); else await productsApi.addVariant(product.id, { size: product.category.usesSizes ? variant.size?.trim() || null : null, color: variant.color?.trim() || null, minimumStock: variant.minimumStock }); setVariantModal(false); await load(); } catch (requestError) { setError(apiMessage(requestError, "No se pudo guardar la variante.", onUnauthorized)); } };
  if (!product) return <div className="flex-1 flex items-center justify-center text-sm text-[#6B6560]">{error || "Cargando producto..."}</div>;
  const status = productVisualStatus(product);
  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Detalle del producto" subtitle={product.name} actions={<div className="flex gap-2"><Btn variant="ghost" size="sm" onClick={() => onNavigate("inventory")}><Icon path={Icons.back} size={14} />Volver</Btn><Btn variant="secondary" size="sm" onClick={openNew}><Icon path={Icons.plus} size={14} />Agregar variante</Btn><Btn variant="primary" size="sm" onClick={() => onNavigate("product-edit", product)}><Icon path={Icons.edit} size={14} />Editar</Btn></div>} />
    <div className="flex-1 overflow-y-auto p-6"><div className="max-w-3xl mx-auto space-y-5">{error && <div className="bg-[#FFEBEE] border border-[#C62828] text-[#C62828] rounded px-4 py-3 text-sm">{error}</div>}<div className="grid grid-cols-3 gap-5"><div className="space-y-3"><ProductImageGallery product={product} onUnauthorized={onUnauthorized} /><div className="flex justify-center"><Badge label={getStatusLabel(status)} color={getStatusColor(status)} /></div></div><div className="col-span-2 bg-white rounded-lg border border-[#E2DDD7] p-5 shadow-sm space-y-4"><div><h2 className="text-xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>{product.name}</h2><p className="font-mono text-xs text-[#6B6560] mt-1">{product.skuBase}</p></div><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-[10px] uppercase text-[#6B6560]">Categoría</p><p>{product.category.name}</p></div><div><p className="text-[10px] uppercase text-[#6B6560]">Programa</p><p>{product.program.name}</p></div><div><p className="text-[10px] uppercase text-[#6B6560]">Creadora</p><p>{product.creatorName}</p></div><div><p className="text-[10px] uppercase text-[#6B6560]">Estado</p><p>{product.active ? "Activo" : "Inactivo"}</p></div></div><div><p className="text-[10px] uppercase text-[#6B6560]">Descripción</p><p className="text-sm">{product.description}</p></div>{product.history && <div><p className="text-[10px] uppercase text-[#6B6560]">Historia</p><p className="text-sm">{product.history}</p></div>}</div></div>
      <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><div className="px-5 py-3.5 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold">Variantes</h3></div><table className="w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["SKU", "Talla", "Color", "Stock", "Mínimo", "Estado", "Acciones"].map((header) => <th key={header} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{product.variants.map((item) => { const itemStatus = variantVisualStatus(item); return <tr key={item.id}><td className="px-5 py-3 font-mono text-xs">{item.sku}</td><td className="px-5 py-3">{item.size || "—"}</td><td className="px-5 py-3">{item.color || "—"}</td><td className="px-5 py-3 font-semibold">{item.stock}</td><td className="px-5 py-3">{item.minimumStock}</td><td className="px-5 py-3"><Badge label={getStatusLabel(itemStatus)} color={getStatusColor(itemStatus)} /></td><td className="px-5 py-3"><div className="flex items-center gap-1"><Btn variant="ghost" size="sm" onClick={() => openEdit(item)}><Icon path={Icons.edit} size={13} /></Btn><Btn variant="ghost" size="sm" onClick={() => openLabel(item)}>Etiqueta</Btn></div></td></tr>; })}</tbody></table></div></div></div>
    {labelVariant && <Modal title="Vista previa de etiqueta" onClose={() => setLabelVariant(null)} width="max-w-3xl"><div className="space-y-4"><div className="label-preview-stage"><LabelArtwork product={product} variant={labelVariant} preview /></div><p className="text-xs text-[#6B6560]">Stock actual: <strong className="text-[#1A1A1A]">{labelVariant.stock}</strong></p><Input label="Cantidad de etiquetas" type="number" value={labelCopies} onChange={setLabelCopies} required />{labelError && <p className="text-xs text-[#C62828]">{labelError}</p>}<div className="flex justify-end gap-2"><Btn variant="secondary" onClick={() => setLabelVariant(null)}>Cancelar</Btn><Btn variant="primary" onClick={printLabels}>Imprimir etiquetas</Btn></div><ProductVariantLabel product={product} variant={labelVariant} copies={Number.isInteger(printableCopies) && printableCopies >= 1 && printableCopies <= 100 ? printableCopies : 1} /></div></Modal>}
    {variantModal && <Modal title={editing ? "Editar variante" : "Agregar variante"} onClose={() => setVariantModal(false)}><div className="space-y-4">{product.category.usesSizes && <Input label="Talla" value={variant.size || ""} onChange={(size) => setVariant({ ...variant, size })} readOnly={!!editing} required />}<Input label="Color" value={variant.color || ""} onChange={(color) => setVariant({ ...variant, color })} readOnly={!!editing} /><Input label="Stock mínimo" type="number" value={String(variant.minimumStock)} onChange={(value) => setVariant({ ...variant, minimumStock: Number(value) })} />{editing && <><Input label="SKU" value={editing.sku} readOnly /><Input label="Stock" value={String(editing.stock)} readOnly /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={variantActive} onChange={(event) => setVariantActive(event.target.checked)} className="accent-[#2D6A6A]" />Variante activa</label></>}<div className="flex justify-end gap-2"><Btn variant="secondary" onClick={() => setVariantModal(false)}>Cancelar</Btn><Btn variant="primary" onClick={() => void saveVariant()}>Guardar</Btn></div></div></Modal>}
  </div>;
}

function RealDashboardScreen({ onNavigate, onUnauthorized }: { onNavigate: (screen: Screen, data?: unknown) => void; onUnauthorized: () => void }) {
  const [dashboard, setDashboard] = useState<ApiDashboard | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { setDashboard(await dashboardApi.get()); } catch (requestError) { setError(apiMessage(requestError, "No se pudo cargar el dashboard.", onUnauthorized)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  if (loading) return <div className="flex-1 flex items-center justify-center text-sm text-[#6B6560]">Cargando dashboard...</div>;
  if (!dashboard) return <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm text-[#C62828]"><span>{error || "No se pudo cargar el dashboard."}</span><Btn variant="secondary" onClick={() => void load()}>Reintentar</Btn></div>;
  const { metrics, movementStats, recentMovements, alerts, categoryStock } = dashboard;
  const quantity = (movement: ApiDashboard["recentMovements"][number]) => `${movement.type === "EXIT" || movement.quantity < 0 ? "" : "+"}${movement.type === "EXIT" ? -movement.quantity : movement.quantity}`;
  const quantityColor = (movement: ApiDashboard["recentMovements"][number]) => movement.type === "EXIT" || movement.quantity < 0 ? "text-[#C62828]" : "text-[#2E7D32]";
  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Dashboard" subtitle="Resumen general del inventario" actions={<div className="flex gap-2"><Btn variant="secondary" size="sm" onClick={() => void load()}>Recargar</Btn><Btn onClick={() => onNavigate("product-new")} variant="primary" size="sm"><Icon path={Icons.plus} size={14} />Nuevo producto</Btn></div>} />
    <div className="flex-1 overflow-y-auto p-6 space-y-6"><div className="grid grid-cols-3 gap-4"><StatCard label="Total productos" value={metrics.totalProducts} icon={Icons.package} color="primary" /><StatCard label="Productos activos" value={metrics.activeProducts} icon={Icons.check} color="success" /><StatCard label="Variantes" value={metrics.totalVariants} icon={Icons.products} color="primary" /><StatCard label="Stock total" value={metrics.totalStock} icon={Icons.inventory} color="success" /><StatCard label="Stock bajo" value={metrics.lowStockVariants} icon={Icons.alert} color="warning" /><StatCard label="Sin stock" value={metrics.outOfStockVariants} icon={Icons.x} color="danger" /></div>
      <div className="grid grid-cols-3 gap-6"><div className="col-span-2 bg-white rounded-lg border border-[#E2DDD7] overflow-hidden shadow-sm"><div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2DDD7]"><div><h3 className="text-sm font-semibold text-[#1A1A1A]">Movimientos recientes</h3><p className="text-[10px] text-[#6B6560]">{movementStats.totalMovements} totales · {movementStats.movementsToday} hoy · últimos {movementStats.periodDays} días: {movementStats.entryMovements} entradas, {movementStats.exitMovements} salidas, {movementStats.adjustmentMovements} ajustes</p></div><Btn variant="ghost" size="sm" onClick={() => onNavigate("movements")}>Ver todo</Btn></div><table className="w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Fecha", "Tipo", "SKU", "Producto", "Cantidad", "Usuario"].map((header) => <th key={header} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B6560] uppercase tracking-wide">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{recentMovements.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-xs text-[#6B6560]">No hay movimientos registrados</td></tr>}{recentMovements.map((movement) => <tr key={movement.id} className="hover:bg-[#F5F3F0] transition-colors"><td className="px-4 py-2 text-xs text-[#6B6560]">{new Date(movement.createdAt).toLocaleString("es-PE")}</td><td className="px-4 py-2"><Badge label={movementTypeLabel(movement.type)} color={movementTypeColor(movement.type)} /></td><td className="px-4 py-2 font-mono text-xs text-[#6B6560]">{movement.variant.sku}</td><td className="px-4 py-2 font-medium text-[#1A1A1A] text-xs">{movement.product.name}</td><td className={`px-4 py-2 text-xs font-semibold ${quantityColor(movement)}`}>{quantity(movement)}</td><td className="px-4 py-2 text-xs text-[#6B6560]">{movement.user.name}</td></tr>)}</tbody></table></div>
        <div className="bg-white rounded-lg border border-[#E2DDD7] overflow-hidden shadow-sm"><div className="px-5 py-3.5 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Alertas de inventario</h3></div><div className="p-4 space-y-2.5">{alerts.length === 0 && <p className="text-xs text-[#6B6560] py-4 text-center">Sin alertas activas</p>}{alerts.map((alert) => <div key={alert.variant.id} onClick={() => onNavigate("product-detail", alert.product)} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:opacity-80 ${alert.status === "OUT_OF_STOCK" ? "bg-[#FFEBEE] border-[#FFCDD2]" : "bg-[#FDF3E7] border-[#FDDCAA]"}`}><Icon path={Icons.alert} size={14} className={alert.status === "OUT_OF_STOCK" ? "text-[#C62828] mt-0.5 flex-shrink-0" : "text-[#C4813A] mt-0.5 flex-shrink-0"} /><div><p className="text-xs font-medium text-[#1A1A1A] leading-tight">{alert.product.name}</p><p className={`text-[10px] mt-0.5 ${alert.status === "OUT_OF_STOCK" ? "text-[#C62828]" : "text-[#C4813A]"}`}>{alert.status === "OUT_OF_STOCK" ? "Sin stock" : `Stock bajo (${alert.stock}/${alert.minimumStock})`}</p><p className="text-[10px] text-[#6B6560] font-mono">{alert.variant.sku}</p></div></div>)}</div></div></div>
      <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm"><div className="px-5 py-3.5 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Stock por categoría</h3></div><div className="p-5 grid grid-cols-5 gap-4">{categoryStock.length === 0 && <p className="col-span-5 text-center text-xs text-[#6B6560]">No hay categorías disponibles</p>}{categoryStock.map((category) => <div key={category.categoryId} className="text-center"><p className="text-2xl font-bold text-[#2D6A6A]" style={{ fontFamily: "var(--font-display)" }}>{category.totalStock}</p><p className="text-xs text-[#6B6560] mt-0.5">{category.categoryName}</p><p className="text-[10px] text-[#6B6560]">{category.productCount} productos · {category.variantCount} variantes</p></div>)}</div></div>
    </div>
  </div>;
}

function movementTypeLabel(type: InventoryMovementType) {
  return type === "ENTRY" ? "Entrada" : type === "EXIT" ? "Salida" : "Ajuste";
}

function movementTypeColor(type: InventoryMovementType) {
  return type === "ENTRY" ? "bg-[#E8F5E9] text-[#2E7D32]" : type === "EXIT" ? "bg-[#FFEBEE] text-[#C62828]" : "bg-[#E3F2FD] text-[#1565C0]";
}

function movementQuantity(movement: ApiInventoryMovement) {
  const value = movement.type === "EXIT" ? -movement.quantity : movement.quantity;
  return `${value > 0 ? "+" : ""}${value}`;
}

function movementQuantityColor(movement: ApiInventoryMovement) {
  return movement.type === "ENTRY" || movement.quantity > 0 && movement.type === "ADJUSTMENT" ? "text-[#2E7D32]" : "text-[#C62828]";
}

function RealMovementsScreen({ onNavigate, onUnauthorized }: { onNavigate: (screen: Screen) => void; onUnauthorized: () => void }) {
  const [type, setType] = useState<InventoryMovementType | "">("");
  const [movements, setMovements] = useState<ApiInventoryMovement[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { const result = await inventoryMovementsApi.list({ type: type || undefined }); setMovements(result.movements); } catch (requestError) { setError(apiMessage(requestError, "No se pudo cargar el historial.", onUnauthorized)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [type]);
  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Movimientos de inventario" subtitle="Historial de entradas, salidas y ajustes" actions={<div className="flex gap-2"><Btn variant="secondary" size="sm" onClick={() => void load()}>Recargar</Btn><Btn variant="primary" size="sm" onClick={() => onNavigate("movement-new")}><Icon path={Icons.plus} size={14} />Registrar movimiento</Btn></div>} />
    <div className="px-6 py-3 border-b border-[#E2DDD7] bg-white flex items-center gap-3">{(["", "ENTRY", "EXIT", "ADJUSTMENT"] as const).map((item) => <button key={item} onClick={() => setType(item)} className={`px-3 py-1 rounded text-xs font-medium transition-all ${type === item ? "bg-[#2D6A6A] text-white" : "text-[#6B6560] hover:bg-[#F5F3F0]"}`}>{item === "" ? "Todos" : movementTypeLabel(item)}</button>)}</div>
    <div className="flex-1 overflow-y-auto"><table className="w-full text-sm"><thead className="bg-[#F5F3F0] sticky top-0"><tr>{["Fecha", "Tipo", "SKU", "Producto", "Cantidad", "Stock", "Usuario", "Motivo"].map((header) => <th key={header} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{loading && <tr><td colSpan={8} className="text-center py-12 text-[#6B6560] text-sm">Cargando movimientos...</td></tr>}{!loading && error && <tr><td colSpan={8} className="text-center py-12 text-[#C62828] text-sm">{error}</td></tr>}{!loading && !error && movements.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6B6560] text-sm">No hay movimientos registrados</td></tr>}{!loading && !error && movements.map((movement) => <tr key={movement.id} className="hover:bg-[#F5F3F0] transition-colors bg-white"><td className="px-5 py-3 text-xs text-[#6B6560]">{new Date(movement.createdAt).toLocaleString("es-PE")}</td><td className="px-5 py-3"><Badge label={movementTypeLabel(movement.type)} color={movementTypeColor(movement.type)} /></td><td className="px-5 py-3 font-mono text-xs text-[#6B6560]">{movement.variant.sku}</td><td className="px-5 py-3 text-xs font-medium text-[#1A1A1A]">{movement.product.name}</td><td className={`px-5 py-3 text-sm font-semibold ${movementQuantityColor(movement)}`}>{movementQuantity(movement)}</td><td className="px-5 py-3 text-xs text-[#6B6560]">{movement.stockBefore} → {movement.stockAfter}</td><td className="px-5 py-3 text-xs text-[#6B6560]">{movement.user.name}</td><td className="px-5 py-3 text-xs text-[#6B6560]">{movement.reason}</td></tr>)}</tbody></table></div><div className="px-6 py-2 border-t border-[#E2DDD7] bg-white text-xs text-[#6B6560]">{movements.length} movimientos</div>
  </div>;
}

function RealNewMovementScreen({ onNavigate, onUnauthorized }: { onNavigate: (screen: Screen) => void; onUnauthorized: () => void }) {
  const [products, setProducts] = useState<ApiProduct[]>([]); const [productId, setProductId] = useState(""); const [variantId, setVariantId] = useState(""); const [type, setType] = useState<InventoryMovementType>("ENTRY"); const [quantity, setQuantity] = useState("1"); const [targetStock, setTargetStock] = useState(""); const [reason, setReason] = useState(""); const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID()); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  useEffect(() => { productsApi.list({ active: true }).then((result) => setProducts(result.products)).catch((requestError) => setError(apiMessage(requestError, "No se pudieron cargar los productos.", onUnauthorized))); }, []);
  const product = products.find((item) => item.id === productId); const variants = product?.variants.filter((item) => item.active) || []; const selectedVariant = variants.find((item) => item.id === variantId);
  const selectProduct = (id: string) => { setProductId(id); setVariantId(""); setError(""); };
  const [scanSku, setScanSku] = useState(""); const [scanLoading, setScanLoading] = useState(false); const [scanMessage, setScanMessage] = useState("");
  const findScannedVariant = async () => {
    const sku = scanSku.trim();
    if (!sku) return setScanMessage("Escribe o escanea un SKU.");
    setScanLoading(true); setScanMessage(""); setError("");
    try {
      const lookup = await productVariantsApi.findBySku(sku);
      const result = await productsApi.get(lookup.product.id);
      setProducts((items) => [result.product, ...items.filter((item) => item.id !== result.product.id)]);
      setProductId(result.product.id); setVariantId(lookup.variant.id); setScanSku(lookup.variant.sku);
      setScanMessage(`Encontrado: ${lookup.product.name} · ${lookup.variant.sku}`);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 404) setScanMessage("No se encontró una variante con este código.");
      else if (requestError instanceof ApiError && requestError.status === 400) setScanMessage("El SKU no tiene un formato válido.");
      else setError(apiMessage(requestError, "No se pudo buscar el SKU.", onUnauthorized));
    } finally { setScanLoading(false); }
  };
  const submit = async () => {
    setError(""); if (!selectedVariant || !reason.trim()) return setError("Selecciona una variante e ingresa un motivo.");
    const parsedQuantity = Number(quantity); const parsedTarget = Number(targetStock);
    if ((type === "ENTRY" || type === "EXIT") && (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0)) return setError("La cantidad debe ser un entero mayor que cero.");
    if (type === "EXIT" && parsedQuantity > selectedVariant.stock) return setError("Stock insuficiente para realizar la salida.");
    if (type === "ADJUSTMENT" && (!Number.isInteger(parsedTarget) || parsedTarget < 0)) return setError("El stock físico debe ser un entero igual o mayor que cero.");
    if (type === "ADJUSTMENT" && parsedTarget === selectedVariant.stock) return setError("El stock contado coincide con el stock registrado.");
    setSaving(true);
    try {
      const data = type === "ADJUSTMENT" ? { variantId: selectedVariant.id, type, targetStock: parsedTarget, reason: reason.trim(), idempotencyKey } : { variantId: selectedVariant.id, type, quantity: parsedQuantity, reason: reason.trim(), idempotencyKey };
      await inventoryMovementsApi.create(data); setSaved(true); setReason(""); setQuantity("1"); setTargetStock(""); setIdempotencyKey(crypto.randomUUID());
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 422) setError("Stock insuficiente para realizar la salida.");
      else if (requestError instanceof ApiError && requestError.status === 409) setError("El producto o variante ya no está disponible para movimientos.");
      else if (requestError instanceof ApiError && requestError.status === 400 && type === "ADJUSTMENT") setError("El stock contado coincide con el stock registrado.");
      else setError(apiMessage(requestError, "No se pudo registrar el movimiento.", onUnauthorized));
    } finally { setSaving(false); }
  };
  if (saved) return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Registrar movimiento" /><div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-4"><Icon path={Icons.check} size={28} className="text-[#2E7D32]" /></div><h3 className="text-lg font-semibold text-[#1A1A1A] mb-1" style={{ fontFamily: "var(--font-display)" }}>Movimiento registrado</h3><p className="text-sm text-[#6B6560] mb-6">El movimiento se registró correctamente</p><div className="flex gap-2 justify-center"><Btn variant="secondary" onClick={() => onNavigate("movements")}>Ver movimientos</Btn><Btn variant="primary" onClick={() => onNavigate("inventory")}>Volver al inventario</Btn></div></div></div></div>;
  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Registrar movimiento" subtitle="Entrada, salida o ajuste de stock" actions={<div className="flex gap-2"><Btn variant="secondary" onClick={() => onNavigate("movements")}>Cancelar</Btn><Btn variant="primary" onClick={() => void submit()} disabled={saving || !variantId || !reason.trim()}><Icon path={Icons.check} size={14} />{saving ? "Registrando..." : "Registrar"}</Btn></div>} />
    <div className="flex-1 overflow-y-auto p-6"><div className="max-w-xl mx-auto"><div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm p-5 space-y-5">{error && <div className="bg-[#FFEBEE] border border-[#C62828] text-[#C62828] rounded px-3 py-2 text-sm">{error}</div>}<form onSubmit={(event) => { event.preventDefault(); void findScannedVariant(); }} className="rounded-lg border border-[#E2DDD7] bg-[#F5F3F0] p-3"><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Escanear o escribir SKU</label><div className="flex gap-2"><input autoFocus value={scanSku} onChange={(event) => setScanSku(event.target.value)} placeholder="Ej: AMA-CAN-0001-UNI-ARC" className="min-w-0 flex-1 border border-[#E2DDD7] rounded px-3 py-2 text-sm font-mono bg-white outline-none focus:border-[#2D6A6A]" /><button type="submit" disabled={scanLoading} className="inline-flex items-center rounded border border-[#E2DDD7] bg-white px-2.5 py-1 text-xs font-medium text-[#1A1A1A] disabled:opacity-50">{scanLoading ? "Buscando..." : "Buscar"}</button></div>{scanMessage && <p className={`mt-2 text-xs ${scanMessage.startsWith("Encontrado:") ? "text-[#2E7D32]" : "text-[#C62828]"}`}>{scanMessage}</p>}</form><div><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide block mb-2">Tipo de movimiento *</label><div className="flex gap-2">{(["ENTRY", "EXIT", "ADJUSTMENT"] as const).map((item) => <button key={item} onClick={() => { setType(item); setError(""); }} className={`flex-1 py-2 rounded text-sm font-medium border transition-all ${type === item ? movementTypeColor(item) + " border-current" : "border-[#E2DDD7] text-[#6B6560] hover:bg-[#F5F3F0]"}`}>{movementTypeLabel(item)}</button>)}</div></div><Select label="Producto" value={productId} onChange={selectProduct} required options={products.map((item) => ({ value: item.id, label: `${item.name} — ${item.skuBase}` }))} />{product && <Select label="Variante" value={variantId} onChange={setVariantId} required options={variants.map((item) => ({ value: item.id, label: `${item.sku} — ${item.size ? `Talla ${item.size} — ` : ""}${item.color || "Sin color"} — Stock ${item.stock}` }))} />}{selectedVariant && <div className="bg-[#F5F3F0] rounded-lg p-3 text-xs"><p className="text-[#6B6560]">SKU: <span className="font-mono text-[#1A1A1A]">{selectedVariant.sku}</span></p><p className="text-[#6B6560] mt-1">Stock actual: <span className="font-bold text-[#1A1A1A]">{selectedVariant.stock} unidades</span></p></div>}{type === "ADJUSTMENT" ? <><p className="text-xs text-[#6B6560]">Stock registrado actualmente: <strong>{selectedVariant?.stock ?? 0}</strong></p><Input label="Stock físico contado" type="number" value={targetStock} onChange={setTargetStock} required /></> : <Input label={type === "ENTRY" ? "Cantidad de entrada" : "Cantidad de salida"} type="number" value={quantity} onChange={setQuantity} required />}<Textarea label="Motivo" value={reason} onChange={setReason} placeholder="Ej: Ingreso de nuevos productos, salida para feria, ajuste por daño..." rows={2} /><div className="bg-[#E8F4F4] rounded-lg p-3 text-xs text-[#2D6A6A]"><Icon path={Icons.alert} size={13} className="inline mr-1" />Todo movimiento queda registrado en el historial y no puede eliminarse.</div></div></div></div>
  </div>;
}

function CategoriesScreen({ currentUser }: { currentUser: AuthenticatedUser }) {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [form, setForm] = useState({ name: "", code: "", usesSizes: false });
  const [selected, setSelected] = useState<ApiCategory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const isAdmin = currentUser.role === "ADMIN";
  const load = async () => { try { setLoading(true); const result = await categoriesApi.list(); setCategories(result.categories); } catch { setMessage("No se pudieron cargar las categorías."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const close = () => { setShowModal(false); setSelected(null); setForm({ name: "", code: "", usesSizes: false }); };
  const save = async () => { try { const result = selected ? await categoriesApi.update(selected.id, form) : await categoriesApi.create(form); setCategories((items) => selected ? items.map((item) => item.id === result.category.id ? result.category : item) : [...items, result.category].sort((a, b) => a.name.localeCompare(b.name))); close(); setMessage("Categoría guardada correctamente"); } catch (error) { setMessage(error instanceof ApiError && error.status === 409 ? "El código de categoría ya existe." : "No se pudo guardar la categoría."); } };
  const edit = (category: ApiCategory) => { setSelected(category); setForm({ name: category.name, code: category.code, usesSizes: category.usesSizes }); setShowModal(true); };
  const toggle = async (category: ApiCategory) => { try { const result = await categoriesApi.update(category.id, { active: !category.active }); setCategories((items) => items.map((item) => item.id === category.id ? result.category : item)); } catch { setMessage("No se pudo actualizar la categoría."); } };
  return <div className="flex-1 flex flex-col overflow-hidden">
    <TopBar title="Categorías de productos" subtitle="Gestión de categorías del inventario" actions={isAdmin ? <Btn variant="primary" size="sm" onClick={() => setShowModal(true)}><Icon path={Icons.plus} size={14} />Nueva categoría</Btn> : undefined} />
    <div className="flex-1 overflow-y-auto p-6"><div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Categoría", "Código", "Usa tallas", "Productos", "Estado", ...(isAdmin ? ["Acciones"] : [])].map((header) => <th key={header} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{loading ? <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-[#6B6560] text-sm">Cargando categorías...</td></tr> : categories.map((category) => <tr key={category.id} className="hover:bg-[#F5F3F0] transition-colors"><td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{category.name}</td><td className="px-5 py-3.5 font-mono text-xs text-[#6B6560]">{category.code}</td><td className="px-5 py-3.5">{category.usesSizes ? <Badge label="Sí" color="bg-[#E3F2FD] text-[#1565C0]" /> : <span className="text-[#6B6560] text-xs">No</span>}</td><td className="px-5 py-3.5"><span className="font-semibold text-[#2D6A6A]">{category.productCount}</span></td><td className="px-5 py-3.5"><Badge label={category.active ? "Activa" : "Inactiva"} color={category.active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 text-gray-500"} /></td>{isAdmin && <td className="px-5 py-3.5 flex gap-1"><Btn variant="ghost" size="sm" onClick={() => edit(category)}><Icon path={Icons.edit} size={13} /></Btn><Btn variant="ghost" size="sm" onClick={() => void toggle(category)}>{category.active ? "Desactivar" : "Activar"}</Btn></td>}</tr>)}</tbody></table></div></div>
    {showModal && <Modal title={selected ? "Editar categoría" : "Nueva categoría"} onClose={close}><div className="space-y-4"><Input label="Nombre de la categoría" value={form.name} onChange={(name) => setForm({ ...form, name })} required /><Input label="Código (para SKU)" value={form.code} onChange={(code) => setForm({ ...form, code })} required /><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.usesSizes} onChange={(event) => setForm({ ...form, usesSizes: event.target.checked })} className="accent-[#2D6A6A]" /><span className="text-sm text-[#1A1A1A]">Esta categoría utiliza tallas</span></label><div className="flex justify-end gap-2 pt-2"><Btn variant="secondary" onClick={close}>Cancelar</Btn><Btn variant="primary" onClick={() => void save()}><Icon path={Icons.check} size={14} />{selected ? "Guardar cambios" : "Crear categoría"}</Btn></div></div></Modal>}
    {message && <Toast message={message} onClose={() => setMessage("")} />}
  </div>;
}

function ProgramsScreen({ currentUser }: { currentUser: AuthenticatedUser }) {
  const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [selected, setSelected] = useState<ApiProgram | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const isAdmin = currentUser.role === "ADMIN";
  const load = async () => { try { setLoading(true); const result = await programsApi.list(); setPrograms(result.programs); } catch { setMessage("No se pudieron cargar los programas."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const close = () => { setShowModal(false); setSelected(null); setForm({ name: "", description: "" }); };
  const save = async () => { try { const data = { name: form.name, description: form.description.trim() || null }; const result = selected ? await programsApi.update(selected.id, data) : await programsApi.create(data); setPrograms((items) => selected ? items.map((item) => item.id === result.program.id ? result.program : item) : [...items, result.program].sort((a, b) => a.name.localeCompare(b.name))); close(); setMessage("Programa guardado correctamente"); } catch { setMessage("No se pudo guardar el programa."); } };
  const edit = (program: ApiProgram) => { setSelected(program); setForm({ name: program.name, description: program.description || "" }); setShowModal(true); };
  const toggle = async (program: ApiProgram) => { try { const result = await programsApi.update(program.id, { active: !program.active }); setPrograms((items) => items.map((item) => item.id === program.id ? result.program : item)); } catch { setMessage("No se pudo actualizar el programa."); } };
  return <div className="flex-1 flex flex-col overflow-hidden">
    <TopBar title="Programas / Talleres" subtitle="Gestión de programas y talleres de origen" actions={isAdmin ? <Btn variant="primary" size="sm" onClick={() => setShowModal(true)}><Icon path={Icons.plus} size={14} />Nuevo programa/taller</Btn> : undefined} />
    <div className="flex-1 overflow-y-auto p-6"><div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Nombre", "Descripción", "Productos", "Estado", ...(isAdmin ? ["Acciones"] : [])].map((header) => <th key={header} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{loading ? <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-[#6B6560] text-sm">Cargando programas...</td></tr> : programs.map((program) => <tr key={program.id} className="hover:bg-[#F5F3F0] transition-colors"><td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{program.name}</td><td className="px-5 py-3.5 text-sm text-[#6B6560]">{program.description || "—"}</td><td className="px-5 py-3.5"><span className="font-semibold text-[#2D6A6A]">{program.productCount}</span></td><td className="px-5 py-3.5"><Badge label={program.active ? "Activo" : "Inactivo"} color={program.active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 text-gray-500"} /></td>{isAdmin && <td className="px-5 py-3.5 flex gap-1"><Btn variant="ghost" size="sm" onClick={() => edit(program)}><Icon path={Icons.edit} size={13} /></Btn><Btn variant="ghost" size="sm" onClick={() => void toggle(program)}>{program.active ? "Desactivar" : "Activar"}</Btn></td>}</tr>)}</tbody></table></div></div>
    {showModal && <Modal title={selected ? "Editar programa / taller" : "Nuevo programa / taller"} onClose={close}><div className="space-y-4"><Input label="Nombre" value={form.name} onChange={(name) => setForm({ ...form, name })} required /><Textarea label="Descripción" value={form.description} onChange={(description) => setForm({ ...form, description })} /><div className="flex justify-end gap-2 pt-2"><Btn variant="secondary" onClick={close}>Cancelar</Btn><Btn variant="primary" onClick={() => void save()}><Icon path={Icons.check} size={14} />{selected ? "Guardar cambios" : "Crear programa"}</Btn></div></div></Modal>}
    {message && <Toast message={message} onClose={() => setMessage("")} />}
  </div>;
}

function reportStatusLabel(status: ApiInventoryReport["stock"][number]["status"]) {
  return status === "AVAILABLE" ? "Disponible" : status === "LOW_STOCK" ? "Stock bajo" : "Sin stock";
}

function reportStatusColor(status: ApiInventoryReport["stock"][number]["status"]) {
  return status === "AVAILABLE" ? "bg-[#E8F5E9] text-[#2E7D32]" : status === "LOW_STOCK" ? "bg-[#FDF3E7] text-[#C4813A]" : "bg-[#FFEBEE] text-[#C62828]";
}

function isoDateOffset(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const content = `\uFEFF${[headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}

function reportsMessage(error: unknown, onUnauthorized: () => void) {
  if (error instanceof ApiError && error.status === 401) {
    onUnauthorized();
    return "La sesión expiró. Inicia sesión nuevamente.";
  }
  if (error instanceof ApiError && error.status === 400) return "Verifica que las fechas sean válidas y no superen un año.";
  if (error instanceof ApiError && error.status === 403) return "No tienes permiso para consultar reportes.";
  if (error instanceof ApiError && error.status >= 500) return "No se pudieron generar los reportes. Intenta nuevamente.";
  return "No se pudo conectar con el servidor de reportes.";
}

function RealReportsScreen({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [from, setFrom] = useState(() => isoDateOffset(-29));
  const [to, setTo] = useState(() => isoDateOffset(0));
  const [report, setReport] = useState<ApiInventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (requestedFrom = from, requestedTo = to) => {
    setLoading(true); setError("");
    try { setReport(await reportsApi.inventory({ from: requestedFrom, to: requestedTo })); }
    catch (requestError) { setError(reportsMessage(requestError, onUnauthorized)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const reset = () => { const nextFrom = isoDateOffset(-29); const nextTo = isoDateOffset(0); setFrom(nextFrom); setTo(nextTo); void load(nextFrom, nextTo); };
  const exportStock = () => {
    if (!report) return;
    downloadCsv(`amaram-stock-${report.period.to}.csv`, ["Producto", "SKU base", "SKU variante", "Categoría", "Programa", "Creadora", "Talla", "Color", "Stock", "Stock mínimo", "Estado"], report.stock.map((row) => [row.productName, row.skuBase, row.sku, row.categoryName, row.programName, row.creatorName, row.size || "-", row.color || "-", row.stock, row.minimumStock, reportStatusLabel(row.status)]));
  };
  const exportMovements = () => {
    if (!report) return;
    downloadCsv(`amaram-movimientos-${report.period.to}.csv`, ["Fecha", "Tipo", "Producto", "SKU base", "SKU variante", "Talla", "Color", "Cantidad", "Stock anterior", "Stock posterior", "Usuario", "Motivo"], report.movements.map((row) => [new Date(row.createdAt).toLocaleString("es-PE"), movementTypeLabel(row.type), row.productName, row.skuBase, row.variantSku, row.size || "-", row.color || "-", row.type === "EXIT" ? -row.quantity : row.quantity, row.stockBefore, row.stockAfter, row.userName, row.reason]));
  };

  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Reportes" subtitle="Resumen operativo de inventario" actions={<div className="flex gap-2"><Btn variant="secondary" size="sm" disabled={!report} onClick={exportStock}>Exportar stock CSV</Btn><Btn variant="secondary" size="sm" disabled={!report} onClick={exportMovements}>Exportar movimientos CSV</Btn></div>} />
    <div className="px-6 py-3 border-b border-[#E2DDD7] bg-white flex items-end gap-3 flex-wrap"><div className="flex flex-col gap-1"><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">Fecha desde</label><input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm bg-[#F5F3F0]" /></div><div className="flex flex-col gap-1"><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">Fecha hasta</label><input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm bg-[#F5F3F0]" /></div><Btn variant="primary" size="sm" disabled={loading || !from || !to} onClick={() => void load()}>Aplicar filtros</Btn><Btn variant="ghost" size="sm" disabled={loading} onClick={reset}>Restablecer</Btn>{report && <p className="text-[10px] text-[#6B6560] mb-1">Período UTC inclusivo: {report.period.from} a {report.period.to}</p>}</div>
    <div className="flex-1 overflow-y-auto p-6 space-y-6">{loading && <div className="text-center py-12 text-sm text-[#6B6560]">Cargando reportes...</div>}{!loading && error && <div className="text-center py-12 space-y-3"><p className="text-sm text-[#C62828]">{error}</p><Btn variant="secondary" onClick={() => void load()}>Reintentar</Btn></div>}{!loading && report && <><div className="grid grid-cols-4 gap-4"><StatCard label="Productos activos" value={report.summary.activeProducts} icon={Icons.products} color="primary" /><StatCard label="Stock total" value={report.summary.totalStock} icon={Icons.inventory} color="success" /><StatCard label="Stock bajo" value={report.summary.lowStockVariants} icon={Icons.alert} color="warning" /><StatCard label="Sin stock" value={report.summary.outOfStockVariants} icon={Icons.x} color="danger" /></div>
      <div className="grid grid-cols-3 gap-5"><div className="col-span-2 bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><div className="px-5 py-3.5 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Stock actual por variante</h3><p className="text-[10px] text-[#6B6560]">{report.stock.length} variantes activas de productos activos</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Producto", "SKU", "Categoría", "Talla / Color", "Stock", "Mínimo", "Estado"].map((header) => <th key={header} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B6560] uppercase whitespace-nowrap">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{report.stock.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-xs text-[#6B6560]">No hay variantes activas para mostrar</td></tr>}{report.stock.map((row) => <tr key={row.variantId}><td className="px-4 py-2 text-xs font-medium text-[#1A1A1A]">{row.productName}</td><td className="px-4 py-2 font-mono text-xs text-[#6B6560]">{row.sku}</td><td className="px-4 py-2 text-xs text-[#6B6560]">{row.categoryName}</td><td className="px-4 py-2 text-xs text-[#6B6560]">{row.size || "-"} / {row.color || "-"}</td><td className="px-4 py-2 text-xs font-semibold">{row.stock}</td><td className="px-4 py-2 text-xs">{row.minimumStock}</td><td className="px-4 py-2"><Badge label={reportStatusLabel(row.status)} color={reportStatusColor(row.status)} /></td></tr>)}</tbody></table></div></div>
        <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><div className="px-5 py-3.5 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Alertas de stock</h3></div><div className="p-4 space-y-2.5">{report.alerts.length === 0 && <p className="py-4 text-center text-xs text-[#6B6560]">Sin alertas activas</p>}{report.alerts.map((alert) => <div key={alert.sku} className={`p-3 rounded-lg border ${alert.status === "OUT_OF_STOCK" ? "bg-[#FFEBEE] border-[#FFCDD2]" : "bg-[#FDF3E7] border-[#FDDCAA]"}`}><p className="text-xs font-medium text-[#1A1A1A]">{alert.productName}</p><p className="font-mono text-[10px] text-[#6B6560] mt-0.5">{alert.sku}</p><p className={`text-[10px] mt-1 ${alert.status === "OUT_OF_STOCK" ? "text-[#C62828]" : "text-[#C4813A]"}`}>{alert.status === "OUT_OF_STOCK" ? "Sin stock" : `Stock bajo (${alert.stock}/${alert.minimumStock})`}</p></div>)}</div></div></div>
      <div className="grid grid-cols-3 gap-5"><div className="col-span-2 bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><div className="px-5 py-3.5 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Movimientos del período</h3><p className="text-[10px] text-[#6B6560]">{report.summary.totalMovementsInPeriod} movimientos · {report.movementSummary.entryMovementCount} entradas / {report.movementSummary.exitMovementCount} salidas / {report.movementSummary.adjustmentMovementCount} ajustes</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Fecha", "Tipo", "Producto", "SKU", "Cantidad", "Stock", "Usuario"].map((header) => <th key={header} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B6560] uppercase whitespace-nowrap">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{report.movements.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-xs text-[#6B6560]">No hay movimientos en este período</td></tr>}{report.movements.map((movement) => { const quantity = movement.type === "EXIT" ? -movement.quantity : movement.quantity; return <tr key={movement.id}><td className="px-4 py-2 text-xs text-[#6B6560] whitespace-nowrap">{new Date(movement.createdAt).toLocaleString("es-PE")}</td><td className="px-4 py-2"><Badge label={movementTypeLabel(movement.type)} color={movementTypeColor(movement.type)} /></td><td className="px-4 py-2 text-xs font-medium">{movement.productName}</td><td className="px-4 py-2 font-mono text-xs text-[#6B6560]">{movement.variantSku}</td><td className={`px-4 py-2 text-xs font-semibold ${quantity >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"}`}>{quantity > 0 ? "+" : ""}{quantity}</td><td className="px-4 py-2 text-xs">{movement.stockBefore} → {movement.stockAfter}</td><td className="px-4 py-2 text-xs text-[#6B6560]">{movement.userName}</td></tr>; })}</tbody></table></div></div>
        <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm p-5 space-y-3"><h3 className="text-sm font-semibold text-[#1A1A1A]">Resumen de movimientos</h3><div className="text-xs text-[#6B6560] space-y-2"><p>Entradas: <strong className="text-[#1A1A1A]">{report.movementSummary.entryMovementCount}</strong> · <strong className="text-[#2E7D32]">+{report.movementSummary.entryUnits} unidades</strong></p><p>Salidas: <strong className="text-[#1A1A1A]">{report.movementSummary.exitMovementCount}</strong> · <strong className="text-[#C62828]">-{report.movementSummary.exitUnits} unidades</strong></p><p>Ajustes: <strong className="text-[#1A1A1A]">{report.movementSummary.adjustmentMovementCount}</strong> · <strong className="text-[#1565C0]">{report.movementSummary.adjustmentNetUnits > 0 ? "+" : ""}{report.movementSummary.adjustmentNetUnits} netas</strong></p></div><div className="pt-3 border-t border-[#E2DDD7]"><p className="text-[10px] uppercase tracking-wide text-[#6B6560] mb-2">Stock por categoría</p>{report.categoryDistribution.map((category) => <div key={category.categoryId} className="flex justify-between text-xs text-[#6B6560] py-1"><span>{category.categoryName}</span><span>{category.totalStock} · {category.variantCount} var.</span></div>)}</div></div></div>
    </>}</div>
  </div>;
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
function SettingsScreen() {
  const sections = [
    { title: "Usuarios", description: "Gestión de cuentas de acceso al sistema", icon: Icons.user, available: false },
    { title: "Categorías", description: "Administración de categorías de productos", icon: Icons.categories, available: true },
    { title: "Colores", description: "Paleta de colores disponibles para variantes", icon: Icons.package, available: false },
    { title: "Tallas", description: "Gestión de tallas disponibles por categoría", icon: Icons.inventory, available: false },
    { title: "Programas / Talleres", description: "Administración de programas y talleres", icon: Icons.programs, available: true },
    { title: "Estados", description: "Configuración de estados de productos", icon: Icons.alert, available: false },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Configuración" subtitle="Opciones del sistema AMARAM" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-3">
          {sections.map(s => (
            <div key={s.title} className={`bg-white rounded-lg border border-[#E2DDD7] p-4 shadow-sm flex items-center gap-4 ${s.available ? "hover:border-[#2D6A6A] cursor-pointer transition-all" : "opacity-60"}`}>
              <div className={`p-2 rounded-lg ${s.available ? "bg-[#E8F4F4]" : "bg-[#F5F3F0]"}`}>
                <Icon path={s.icon} size={18} className={s.available ? "text-[#2D6A6A]" : "text-[#6B6560]"} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1A1A1A]">{s.title}</p>
                <p className="text-xs text-[#6B6560]">{s.description}</p>
              </div>
              {!s.available ? (
                <Badge label="En desarrollo" color="bg-[#F5F3F0] text-[#6B6560]" />
              ) : (
                <Icon path={Icons.chevronRight} size={16} className="text-[#6B6560]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("login");
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let mounted = true;

    authApi.me()
      .then(({ user }) => {
        if (!mounted) return;
        setCurrentUser(user);
        setScreen("dashboard");
      })
      .catch(() => {
        if (!mounted) return;
        setCurrentUser(null);
        setScreen("login");
      })
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const navigate = (s: Screen, data?: unknown) => {
    if (data && typeof data === "object" && "name" in (data as object)) {
      setSelectedProduct(data as ApiProduct);
    }
    setScreen(s);
  };

  const handleLogin = (user: AuthenticatedUser) => {
    setCurrentUser(user);
    setScreen("dashboard");
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // La interfaz vuelve a estado no autenticado aunque la red falle.
    } finally {
      setCurrentUser(null);
      setScreen("login");
      setSelectedProduct(null);
    }
  };

  const handleSaveProduct = (product: ApiProduct) => {
    setSelectedProduct(product);
    showToast(screen === "product-edit" ? "Producto actualizado correctamente" : "Producto registrado correctamente");
    setScreen("product-detail");
  };

  const handleUnauthorized = () => {
    setCurrentUser(null);
    setSelectedProduct(null);
    setScreen("login");
  };


  if (authLoading) return <AuthLoadingScreen />;
  if (screen === "login") return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-[#F5F3F0] overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      <Sidebar currentScreen={screen} onNavigate={navigate} currentUser={currentUser!} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {screen === "dashboard" && <RealDashboardScreen onNavigate={navigate} onUnauthorized={handleUnauthorized} />}
        {screen === "inventory" && <RealInventoryScreen onNavigate={navigate} onUnauthorized={handleUnauthorized} />}
        {(screen === "product-new") && <RealProductFormScreen onNavigate={navigate} onSaved={handleSaveProduct} onUnauthorized={handleUnauthorized} />}
        {screen === "product-edit" && selectedProduct && <RealProductFormScreen onNavigate={navigate} onSaved={handleSaveProduct} onUnauthorized={handleUnauthorized} editProduct={selectedProduct} />}
        {screen === "product-detail" && selectedProduct && <RealProductDetailScreen productId={selectedProduct.id} onNavigate={navigate} onUnauthorized={handleUnauthorized} />}
        {screen === "categories" && <CategoriesScreen currentUser={currentUser!} />}
        {screen === "programs" && <ProgramsScreen currentUser={currentUser!} />}
        {screen === "movements" && <RealMovementsScreen onNavigate={navigate} onUnauthorized={handleUnauthorized} />}
        {screen === "movement-new" && <RealNewMovementScreen onNavigate={navigate} onUnauthorized={handleUnauthorized} />}
        {screen === "reports" && <RealReportsScreen onUnauthorized={handleUnauthorized} />}
        {screen === "settings" && <SettingsScreen />}
      </main>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
