import { useEffect, useMemo, useRef, useState } from "react";
import {
  USERS, CATEGORIES, PROGRAMS, PRODUCTS, MOVEMENTS,
  type User, type Category, type Program, type Product, type Movement, type ProductVariant,
} from "./data";
import {
  ApiError, authApi, categoriesApi, dashboardApi, inventoryMovementsApi, productImagesApi, productsApi, programsApi,
  type ApiCategory, type ApiDashboard, type ApiInventoryMovement, type ApiProduct, type ApiProductVariant,
  type ApiProductImage, type ApiProgram, type AuthenticatedUser, type InventoryMovementType, type ProductVariantInput,
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
function getStatusLabel(status: Product["status"]) {
  return { available: "Disponible", low_stock: "Stock bajo", out_of_stock: "Sin stock", inactive: "Inactivo" }[status];
}
function getStatusColor(status: Product["status"]) {
  return {
    available: "bg-[#E8F5E9] text-[#2E7D32]",
    low_stock: "bg-[#FDF3E7] text-[#C4813A]",
    out_of_stock: "bg-[#FFEBEE] text-[#C62828]",
    inactive: "bg-gray-100 text-gray-500",
  }[status];
}
function getMovTypeLabel(t: Movement["type"]) {
  return { entrada: "Entrada", salida: "Salida", ajuste: "Ajuste" }[t];
}
function getMovTypeColor(t: Movement["type"]) {
  return { entrada: "bg-[#E8F5E9] text-[#2E7D32]", salida: "bg-[#FFEBEE] text-[#C62828]", ajuste: "bg-[#E3F2FD] text-[#1565C0]" }[t];
}
function getCategoryById(id: string) { return CATEGORIES.find(c => c.id === id); }
function getProgramById(id: string) { return PROGRAMS.find(p => p.id === id); }
function getUserById(id: string) { return USERS.find(u => u.id === id); }
function totalStock(p: Product) { return p.variants.reduce((s, v) => s + v.stock, 0); }
function computeStatus(p: Product): Product["status"] {
  if (p.status === "inactive") return "inactive";
  const s = totalStock(p);
  if (s === 0) return "out_of_stock";
  if (s <= 3) return "low_stock";
  return "available";
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

function DashboardScreen({ onNavigate, products }: { onNavigate: (s: Screen, data?: unknown) => void; products: Product[] }) {
  const total = products.length;
  const available = products.filter(p => computeStatus(p) === "available").length;
  const outOfStock = products.filter(p => computeStatus(p) === "out_of_stock").length;
  const lowStock = products.filter(p => computeStatus(p) === "low_stock").length;
  const recent = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const alerts = products.filter(p => ["out_of_stock", "low_stock"].includes(computeStatus(p)));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Dashboard" subtitle="Resumen general del inventario"
        actions={<Btn onClick={() => onNavigate("product-new")} variant="primary" size="sm"><Icon path={Icons.plus} size={14} />Nuevo producto</Btn>} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total productos" value={total} icon={Icons.package} color="primary" />
          <StatCard label="Disponibles" value={available} icon={Icons.check} color="success" />
          <StatCard label="Stock bajo" value={lowStock} icon={Icons.alert} color="warning" />
          <StatCard label="Sin stock" value={outOfStock} icon={Icons.x} color="danger" />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent products */}
          <div className="col-span-2 bg-white rounded-lg border border-[#E2DDD7] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2DDD7]">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Productos registrados recientemente</h3>
              <Btn variant="ghost" size="sm" onClick={() => onNavigate("inventory")}>Ver todo</Btn>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#F5F3F0]">
                <tr>{["Foto", "SKU", "Producto", "Categoría", "Stock", "Estado"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B6560] uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD7]">
                {recent.map(p => {
                  const cat = getCategoryById(p.categoryId);
                  const sku = p.variants[0]?.sku || "—";
                  const stock = totalStock(p);
                  return (
                    <tr key={p.id} className="hover:bg-[#F5F3F0] cursor-pointer transition-colors" onClick={() => onNavigate("product-detail", p)}>
                      <td className="px-4 py-2"><ProductPhoto src={p.photo} alt={p.name} size={32} /></td>
                      <td className="px-4 py-2 font-mono text-xs text-[#6B6560]">{sku}</td>
                      <td className="px-4 py-2 font-medium text-[#1A1A1A] text-xs">{p.name}</td>
                      <td className="px-4 py-2 text-xs text-[#6B6560]">{cat?.name}</td>
                      <td className="px-4 py-2 text-xs font-medium">{stock}</td>
                      <td className="px-4 py-2"><Badge label={getStatusLabel(computeStatus(p))} color={getStatusColor(computeStatus(p))} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg border border-[#E2DDD7] overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#E2DDD7]">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Alertas de inventario</h3>
            </div>
            <div className="p-4 space-y-2.5">
              {alerts.length === 0 && <p className="text-xs text-[#6B6560] py-4 text-center">Sin alertas activas</p>}
              {alerts.map(p => {
                const st = computeStatus(p);
                return (
                  <div key={p.id} onClick={() => onNavigate("product-detail", p)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:opacity-80 ${st === "out_of_stock" ? "bg-[#FFEBEE] border-[#FFCDD2]" : "bg-[#FDF3E7] border-[#FDDCAA]"}`}>
                    <Icon path={Icons.alert} size={14} className={st === "out_of_stock" ? "text-[#C62828] mt-0.5 flex-shrink-0" : "text-[#C4813A] mt-0.5 flex-shrink-0"} />
                    <div>
                      <p className="text-xs font-medium text-[#1A1A1A] leading-tight">{p.name}</p>
                      <p className={`text-[10px] mt-0.5 ${st === "out_of_stock" ? "text-[#C62828]" : "text-[#C4813A]"}`}>
                        {st === "out_of_stock" ? "Sin stock" : `Stock bajo (${totalStock(p)} unidades)`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category counts */}
        <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#E2DDD7]">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Productos por categoría</h3>
          </div>
          <div className="p-5 grid grid-cols-5 gap-4">
            {CATEGORIES.map(cat => {
              const count = products.filter(p => p.categoryId === cat.id).length;
              return (
                <div key={cat.id} className="text-center">
                  <p className="text-2xl font-bold text-[#2D6A6A]" style={{ fontFamily: "var(--font-display)" }}>{count}</p>
                  <p className="text-xs text-[#6B6560] mt-0.5">{cat.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inventory Screen ─────────────────────────────────────────────────────────
function InventoryScreen({ onNavigate, products }: { onNavigate: (s: Screen, data?: unknown) => void; products: Product[] }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [progFilter, setProgFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");

  const filtered = useMemo(() => {
    return products.filter(p => {
      const cat = getCategoryById(p.categoryId);
      const prog = getProgramById(p.programId);
      const status = computeStatus(p);
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.variants.some(v => v.sku.toLowerCase().includes(q)) || p.creator.toLowerCase().includes(q) || cat?.name.toLowerCase().includes(q);
      const matchCat = !catFilter || p.categoryId === catFilter;
      const matchProg = !progFilter || p.programId === progFilter;
      const matchStatus = !statusFilter || status === statusFilter;
      const matchColor = !colorFilter || p.variants.some(v => v.color.toLowerCase().includes(colorFilter.toLowerCase()));
      return matchSearch && matchCat && matchProg && matchStatus && matchColor;
    });
  }, [products, search, catFilter, progFilter, statusFilter, colorFilter]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Inventario" subtitle={`${products.length} productos registrados`}
        actions={<Btn onClick={() => onNavigate("product-new")} variant="primary" size="sm"><Icon path={Icons.plus} size={14} />Nuevo producto</Btn>} />

      {/* Filters */}
      <div className="px-6 py-3 border-b border-[#E2DDD7] bg-white flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Icon path={Icons.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6560]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, SKU, creadora..."
            className="w-full pl-8 pr-3 py-1.5 border border-[#E2DDD7] rounded text-sm outline-none focus:border-[#2D6A6A] transition-all bg-[#F5F3F0]" />
        </div>
        {[
          { value: catFilter, setter: setCatFilter, opts: CATEGORIES.map(c => ({ value: c.id, label: c.name })), placeholder: "Categoría" },
          { value: progFilter, setter: setProgFilter, opts: PROGRAMS.map(p => ({ value: p.id, label: p.name })), placeholder: "Programa" },
          { value: statusFilter, setter: setStatusFilter, opts: [{ value: "available", label: "Disponible" }, { value: "low_stock", label: "Stock bajo" }, { value: "out_of_stock", label: "Sin stock" }, { value: "inactive", label: "Inactivo" }], placeholder: "Estado" },
        ].map(({ value, setter, opts, placeholder }) => (
          <select key={placeholder} value={value} onChange={e => setter(e.target.value)}
            className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm text-[#6B6560] bg-[#F5F3F0] outline-none focus:border-[#2D6A6A] transition-all">
            <option value="">{placeholder}</option>
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <input value={colorFilter} onChange={e => setColorFilter(e.target.value)} placeholder="Color"
          className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm text-[#6B6560] bg-[#F5F3F0] outline-none focus:border-[#2D6A6A] transition-all w-24" />
        {(search || catFilter || progFilter || statusFilter || colorFilter) && (
          <Btn variant="ghost" size="sm" onClick={() => { setSearch(""); setCatFilter(""); setProgFilter(""); setStatusFilter(""); setColorFilter(""); }}>
            Limpiar
          </Btn>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-[#F5F3F0] sticky top-0 z-10">
            <tr>{["Foto", "SKU", "Producto", "Categoría", "Talla", "Color", "Programa/Taller", "Creadora", "Stock", "Estado", "Acciones"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-[#E2DDD7]">
            {filtered.length === 0 && (
              <tr><td colSpan={11} className="text-center py-12 text-[#6B6560] text-sm">No se encontraron productos</td></tr>
            )}
            {filtered.map(p => {
              const cat = getCategoryById(p.categoryId);
              const prog = getProgramById(p.programId);
              const status = computeStatus(p);
              const mainVariant = p.variants[0];
              const stock = totalStock(p);
              return (
                <tr key={p.id} className="hover:bg-[#F5F3F0] transition-colors bg-white">
                  <td className="px-4 py-2.5"><ProductPhoto src={p.photo} alt={p.name} size={32} /></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-[#6B6560]">{mainVariant?.sku}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-[#1A1A1A] text-xs">{p.name}</p>
                    {p.variants.length > 1 && <p className="text-[10px] text-[#6B6560]">{p.variants.length} variantes</p>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#6B6560]">{cat?.name}</td>
                  <td className="px-4 py-2.5 text-xs text-[#6B6560]">
                    {cat?.usesSizes ? (p.variants.map(v => v.size).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ") || "—") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#6B6560]">
                    {p.variants.map(v => v.color).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#6B6560]">{prog?.name}</td>
                  <td className="px-4 py-2.5 text-xs text-[#6B6560]">{p.creator}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-[#1A1A1A]">{stock}</td>
                  <td className="px-4 py-2.5"><Badge label={getStatusLabel(status)} color={getStatusColor(status)} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <Btn variant="ghost" size="sm" onClick={() => onNavigate("product-detail", p)} className="!px-2"><Icon path={Icons.eye} size={13} /></Btn>
                      <Btn variant="ghost" size="sm" onClick={() => onNavigate("product-edit", p)} className="!px-2"><Icon path={Icons.edit} size={13} /></Btn>
                      <Btn variant="ghost" size="sm" onClick={() => onNavigate("movements")} className="!px-2"><Icon path={Icons.history} size={13} /></Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-2 border-t border-[#E2DDD7] bg-white text-xs text-[#6B6560]">
        Mostrando {filtered.length} de {products.length} productos
      </div>
    </div>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────
function ProductFormScreen({
  onNavigate, onSave, editProduct,
}: { onNavigate: (s: Screen) => void; onSave: (p: Product) => void; editProduct?: Product }) {
  const isEdit = !!editProduct;
  const cat = editProduct ? getCategoryById(editProduct.categoryId) : null;

  const [name, setName] = useState(editProduct?.name || "");
  const [desc, setDesc] = useState(editProduct?.description || "");
  const [history, setHistory] = useState(editProduct?.history || "");
  const [categoryId, setCategoryId] = useState(editProduct?.categoryId || "");
  const [programId, setProgramId] = useState(editProduct?.programId || "");
  const [creator, setCreator] = useState(editProduct?.creator || "");
  const [photo, setPhoto] = useState(editProduct?.photo || "");
  const [variants, setVariants] = useState<ProductVariant[]>(editProduct?.variants || [{ id: "nv1", sku: "AMA-ROP-0001", color: "", stock: 0 }]);

  const selectedCat = CATEGORIES.find(c => c.id === categoryId);
  const usesSizes = selectedCat?.usesSizes || false;
  const nextSku = `AMA-${selectedCat?.code || "ROP"}-${String(PRODUCTS.length + 1).padStart(4, "0")}`;

  const handleAddVariant = () => {
    const idx = variants.length + 1;
    setVariants([...variants, { id: `nv${idx}`, sku: `${nextSku.slice(0, -4)}${String(idx).padStart(4, "0")}`, color: "", stock: 0 }]);
  };

  const updateVariant = (idx: number, key: keyof ProductVariant, val: string | number) => {
    setVariants(variants.map((v, i) => i === idx ? { ...v, [key]: val } : v));
  };

  const handleSave = () => {
    const product: Product = {
      id: editProduct?.id || `p${Date.now()}`,
      name, description: desc, history, categoryId, programId, creator, photo,
      variants: variants.map((v, i) => ({ ...v, sku: `AMA-${selectedCat?.code || "ROP"}-${String((editProduct ? 0 : PRODUCTS.length) + i + 1).padStart(4, "0")}` })),
      status: "available",
      createdAt: editProduct?.createdAt || new Date().toISOString().slice(0, 10),
    };
    onSave(product);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title={isEdit ? "Editar producto" : "Nuevo producto"} subtitle={isEdit ? editProduct?.name : "Registro de nuevo producto"}
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => onNavigate("inventory")}>Cancelar</Btn>
            <Btn variant="primary" onClick={handleSave}><Icon path={Icons.check} size={14} />{isEdit ? "Guardar cambios" : "Registrar producto"}</Btn>
          </div>
        } />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm">
            <div className="px-5 py-4 border-b border-[#E2DDD7]">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Información básica</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Nombre del producto" value={name} onChange={setName} placeholder="Ej: Canasta tejida natural" required />
              </div>
              <Select label="Categoría" value={categoryId} onChange={setCategoryId} required
                options={CATEGORIES.map(c => ({ value: c.id, label: c.name }))} />
              <Select label="Programa / Taller" value={programId} onChange={setProgramId} required
                options={PROGRAMS.map(p => ({ value: p.id, label: p.name }))} />
              <div className="col-span-2">
                <Input label="Creadora / Diseñadora" value={creator} onChange={setCreator} placeholder="Nombre de la artesana" required />
              </div>
              <div className="col-span-2">
                <Textarea label="Descripción del producto" value={desc} onChange={setDesc} placeholder="Descripción breve del producto..." rows={2} />
              </div>
              <div className="col-span-2">
                <Textarea label="Historia del producto" value={history} onChange={setHistory} placeholder="Historia o contexto de este producto..." rows={3} />
              </div>
            </div>
          </div>

          {/* Photo */}
          <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm">
            <div className="px-5 py-4 border-b border-[#E2DDD7]">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Fotografía del producto</h3>
            </div>
            <div className="p-5 flex items-start gap-5">
              <div className="w-28 h-28 rounded-lg border-2 border-dashed border-[#E2DDD7] bg-[#F5F3F0] flex items-center justify-center overflow-hidden flex-shrink-0">
                {photo ? <img src={photo} className="w-full h-full object-cover rounded-lg" alt="" /> : <Icon path={Icons.upload} size={24} className="text-[#6B6560]" />}
              </div>
              <div className="flex-1">
                <Input label="URL de la fotografía" value={photo} onChange={setPhoto} placeholder="https://..." />
                <p className="text-[10px] text-[#6B6560] mt-2">En la versión final se podrá cargar directamente desde el dispositivo.</p>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm">
            <div className="px-5 py-4 border-b border-[#E2DDD7] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Variantes {usesSizes ? "(talla + color)" : "(color)"}</h3>
                <p className="text-[10px] text-[#6B6560] mt-0.5">Cada variante tiene su propio SKU y stock</p>
              </div>
              <Btn variant="secondary" size="sm" onClick={handleAddVariant}><Icon path={Icons.plus} size={13} />Agregar variante</Btn>
            </div>
            <div className="p-5 space-y-3">
              {variants.map((v, i) => (
                <div key={v.id} className="grid gap-3 p-3 bg-[#F5F3F0] rounded-lg border border-[#E2DDD7]"
                  style={{ gridTemplateColumns: usesSizes ? "1fr 1fr 1fr 1fr auto" : "1fr 1fr 1fr auto" }}>
                  <div>
                    <label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">SKU (generado)</label>
                    <div className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs font-mono text-[#6B6560] bg-white">
                      {selectedCat ? `AMA-${selectedCat.code}-${String(i + 1).padStart(4, "0")}` : "—"}
                    </div>
                  </div>
                  {usesSizes && (
                    <div>
                      <label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Talla</label>
                      <select value={v.size || ""} onChange={e => updateVariant(i, "size", e.target.value)}
                        className="w-full border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-[#2D6A6A]">
                        <option value="">— Talla —</option>
                        {["XS", "S", "M", "L", "XL"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Color</label>
                    <input value={v.color} onChange={e => updateVariant(i, "color", e.target.value)} placeholder="Ej: Beige"
                      className="w-full border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-[#2D6A6A]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Stock inicial</label>
                    <input type="number" min={0} value={v.stock} onChange={e => updateVariant(i, "stock", parseInt(e.target.value) || 0)}
                      className="w-full border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs bg-white outline-none focus:border-[#2D6A6A]" />
                  </div>
                  <div className="flex items-end">
                    {variants.length > 1 && (
                      <button onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                        className="p-1.5 text-[#C62828] hover:bg-[#FFEBEE] rounded transition-colors">
                        <Icon path={Icons.x} size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Detail ───────────────────────────────────────────────────────────
function ProductDetailScreen({ product, onNavigate }: { product: Product; onNavigate: (s: Screen, data?: unknown) => void }) {
  const cat = getCategoryById(product.categoryId);
  const prog = getProgramById(product.programId);
  const status = computeStatus(product);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Detalle del producto" subtitle={product.name}
        actions={
          <div className="flex gap-2">
            <Btn variant="ghost" size="sm" onClick={() => onNavigate("inventory")}><Icon path={Icons.back} size={14} />Volver</Btn>
            <Btn variant="secondary" size="sm" onClick={() => onNavigate("movements")}><Icon path={Icons.history} size={14} />Movimientos</Btn>
            <Btn variant="primary" size="sm" onClick={() => onNavigate("product-edit", product)}><Icon path={Icons.edit} size={14} />Editar</Btn>
          </div>
        } />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="grid grid-cols-3 gap-5">
            {/* Photo panel */}
            <div className="bg-white rounded-lg border border-[#E2DDD7] p-4 shadow-sm flex flex-col items-center gap-3">
              <img src={product.photo} alt={product.name}
                className="w-full aspect-square object-cover rounded-lg bg-[#F5F3F0]" />
              <Badge label={getStatusLabel(status)} color={getStatusColor(status)} />
            </div>

            {/* Main info */}
            <div className="col-span-2 bg-white rounded-lg border border-[#E2DDD7] p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>{product.name}</h2>
                <p className="text-xs font-mono text-[#6B6560] mt-1">{product.variants[0]?.sku}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Categoría", value: cat?.name },
                  { label: "Programa / Taller", value: prog?.name },
                  { label: "Creadora / Diseñadora", value: product.creator },
                  { label: "Registrado", value: product.createdAt },
                  { label: "Stock total", value: totalStock(product) + " unidades" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-[#1A1A1A] font-medium mt-0.5">{value || "—"}</p>
                  </div>
                ))}
              </div>
              {product.description && (
                <div>
                  <p className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide mb-1">Descripción</p>
                  <p className="text-sm text-[#1A1A1A]">{product.description}</p>
                </div>
              )}
              {product.history && (
                <div className="bg-[#F5F3F0] rounded-lg p-3 border-l-2 border-[#2D6A6A]">
                  <p className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide mb-1">Historia del producto</p>
                  <p className="text-xs text-[#1A1A1A] italic">{product.history}</p>
                </div>
              )}
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm">
            <div className="px-5 py-4 border-b border-[#E2DDD7]">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Variantes e inventario</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#F5F3F0]">
                <tr>
                  {["SKU", "Talla", "Color", "Stock", "Estado"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD7]">
                {product.variants.map(v => {
                  const vStatus: Product["status"] = v.stock === 0 ? "out_of_stock" : v.stock <= 2 ? "low_stock" : "available";
                  return (
                    <tr key={v.id} className="hover:bg-[#F5F3F0] transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-[#6B6560]">{v.sku}</td>
                      <td className="px-5 py-3 text-sm">{v.size || "—"}</td>
                      <td className="px-5 py-3 text-sm">{v.color}</td>
                      <td className="px-5 py-3 text-sm font-semibold">{v.stock}</td>
                      <td className="px-5 py-3"><Badge label={getStatusLabel(vStatus)} color={getStatusColor(vStatus)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Categories Screen ────────────────────────────────────────────────────────
type ProductVisualStatus = "available" | "low_stock" | "out_of_stock" | "inactive";
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

function RealProductDetailScreen({ productId, onNavigate, onUnauthorized }: { productId: string; onNavigate: (screen: Screen, data?: unknown) => void; onUnauthorized: () => void }) {
  const [product, setProduct] = useState<ApiProduct | null>(null); const [error, setError] = useState(""); const [variantModal, setVariantModal] = useState(false); const [editing, setEditing] = useState<ApiProductVariant | null>(null); const [variant, setVariant] = useState<ProductVariantInput>({ size: null, color: null, minimumStock: 0 }); const [variantActive, setVariantActive] = useState(true);
  const load = async () => { try { const result = await productsApi.get(productId); setProduct(result.product); } catch (requestError) { setError(apiMessage(requestError, "No se pudo cargar el producto.", onUnauthorized)); } };
  useEffect(() => { void load(); }, [productId]);
  const openNew = () => { setEditing(null); setVariant({ size: null, color: null, minimumStock: 0 }); setVariantActive(true); setVariantModal(true); };
  const openEdit = (item: ApiProductVariant) => { setEditing(item); setVariant({ size: item.size, color: item.color, minimumStock: item.minimumStock }); setVariantActive(item.active); setVariantModal(true); };
  const saveVariant = async () => { if (!product) return; setError(""); try { if (editing) await productsApi.updateVariant(product.id, editing.id, { minimumStock: variant.minimumStock, active: variantActive }); else await productsApi.addVariant(product.id, { size: product.category.usesSizes ? variant.size?.trim() || null : null, color: variant.color?.trim() || null, minimumStock: variant.minimumStock }); setVariantModal(false); await load(); } catch (requestError) { setError(apiMessage(requestError, "No se pudo guardar la variante.", onUnauthorized)); } };
  if (!product) return <div className="flex-1 flex items-center justify-center text-sm text-[#6B6560]">{error || "Cargando producto..."}</div>;
  const status = productVisualStatus(product);
  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Detalle del producto" subtitle={product.name} actions={<div className="flex gap-2"><Btn variant="ghost" size="sm" onClick={() => onNavigate("inventory")}><Icon path={Icons.back} size={14} />Volver</Btn><Btn variant="secondary" size="sm" onClick={openNew}><Icon path={Icons.plus} size={14} />Agregar variante</Btn><Btn variant="primary" size="sm" onClick={() => onNavigate("product-edit", product)}><Icon path={Icons.edit} size={14} />Editar</Btn></div>} />
    <div className="flex-1 overflow-y-auto p-6"><div className="max-w-3xl mx-auto space-y-5">{error && <div className="bg-[#FFEBEE] border border-[#C62828] text-[#C62828] rounded px-4 py-3 text-sm">{error}</div>}<div className="grid grid-cols-3 gap-5"><div className="space-y-3"><ProductImageGallery product={product} onUnauthorized={onUnauthorized} /><div className="flex justify-center"><Badge label={getStatusLabel(status)} color={getStatusColor(status)} /></div></div><div className="col-span-2 bg-white rounded-lg border border-[#E2DDD7] p-5 shadow-sm space-y-4"><div><h2 className="text-xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>{product.name}</h2><p className="font-mono text-xs text-[#6B6560] mt-1">{product.skuBase}</p></div><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-[10px] uppercase text-[#6B6560]">Categoría</p><p>{product.category.name}</p></div><div><p className="text-[10px] uppercase text-[#6B6560]">Programa</p><p>{product.program.name}</p></div><div><p className="text-[10px] uppercase text-[#6B6560]">Creadora</p><p>{product.creatorName}</p></div><div><p className="text-[10px] uppercase text-[#6B6560]">Estado</p><p>{product.active ? "Activo" : "Inactivo"}</p></div></div><div><p className="text-[10px] uppercase text-[#6B6560]">Descripción</p><p className="text-sm">{product.description}</p></div>{product.history && <div><p className="text-[10px] uppercase text-[#6B6560]">Historia</p><p className="text-sm">{product.history}</p></div>}</div></div>
      <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><div className="px-5 py-3.5 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold">Variantes</h3></div><table className="w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["SKU", "Talla", "Color", "Stock", "Mínimo", "Estado", "Acciones"].map((header) => <th key={header} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{product.variants.map((item) => { const itemStatus = variantVisualStatus(item); return <tr key={item.id}><td className="px-5 py-3 font-mono text-xs">{item.sku}</td><td className="px-5 py-3">{item.size || "—"}</td><td className="px-5 py-3">{item.color || "—"}</td><td className="px-5 py-3 font-semibold">{item.stock}</td><td className="px-5 py-3">{item.minimumStock}</td><td className="px-5 py-3"><Badge label={getStatusLabel(itemStatus)} color={getStatusColor(itemStatus)} /></td><td className="px-5 py-3"><Btn variant="ghost" size="sm" onClick={() => openEdit(item)}><Icon path={Icons.edit} size={13} /></Btn></td></tr>; })}</tbody></table></div></div></div>
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
    <div className="flex-1 overflow-y-auto p-6"><div className="max-w-xl mx-auto"><div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm p-5 space-y-5">{error && <div className="bg-[#FFEBEE] border border-[#C62828] text-[#C62828] rounded px-3 py-2 text-sm">{error}</div>}<div><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide block mb-2">Tipo de movimiento *</label><div className="flex gap-2">{(["ENTRY", "EXIT", "ADJUSTMENT"] as const).map((item) => <button key={item} onClick={() => { setType(item); setError(""); }} className={`flex-1 py-2 rounded text-sm font-medium border transition-all ${type === item ? movementTypeColor(item) + " border-current" : "border-[#E2DDD7] text-[#6B6560] hover:bg-[#F5F3F0]"}`}>{movementTypeLabel(item)}</button>)}</div></div><Select label="Producto" value={productId} onChange={selectProduct} required options={products.map((item) => ({ value: item.id, label: `${item.name} — ${item.skuBase}` }))} />{product && <Select label="Variante" value={variantId} onChange={setVariantId} required options={variants.map((item) => ({ value: item.id, label: `${item.sku} — ${item.size ? `Talla ${item.size} — ` : ""}${item.color || "Sin color"} — Stock ${item.stock}` }))} />}{selectedVariant && <div className="bg-[#F5F3F0] rounded-lg p-3 text-xs"><p className="text-[#6B6560]">SKU: <span className="font-mono text-[#1A1A1A]">{selectedVariant.sku}</span></p><p className="text-[#6B6560] mt-1">Stock actual: <span className="font-bold text-[#1A1A1A]">{selectedVariant.stock} unidades</span></p></div>}{type === "ADJUSTMENT" ? <><p className="text-xs text-[#6B6560]">Stock registrado actualmente: <strong>{selectedVariant?.stock ?? 0}</strong></p><Input label="Stock físico contado" type="number" value={targetStock} onChange={setTargetStock} required /></> : <Input label={type === "ENTRY" ? "Cantidad de entrada" : "Cantidad de salida"} type="number" value={quantity} onChange={setQuantity} required />}<Textarea label="Motivo" value={reason} onChange={setReason} placeholder="Ej: Ingreso de nuevos productos, salida para feria, ajuste por daño..." rows={2} /><div className="bg-[#E8F4F4] rounded-lg p-3 text-xs text-[#2D6A6A]"><Icon path={Icons.alert} size={13} className="inline mr-1" />Todo movimiento queda registrado en el historial y no puede eliminarse.</div></div></div></div>
  </div>;
}

/*function CategoriesScreen({ products, currentUser }: { products: Product[]; currentUser: AuthenticatedUser }) {
  const [showModal, setShowModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", code: "", usesSizes: false });
  const [cats, setCats] = useState<ApiCategory[]>([]);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const isAdmin = currentUser.role === "ADMIN";

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const { categories } = await categoriesApi.list();
      setCats(categories);
    } catch {
      setError("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCategories(); }, []);

  const handleAdd = () => {
    if (!newCat.name) return;
    setCats([...cats, { id: `cat${Date.now()}`, name: newCat.name, code: newCat.code.toUpperCase() || "CAT", usesSizes: newCat.usesSizes, status: "active" }]);
    setShowModal(false);
    setNewCat({ name: "", code: "", usesSizes: false });
    setToast("Categoría registrada correctamente");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Categorías de productos" subtitle="Gestión de categorías del inventario"
        actions={<Btn variant="primary" size="sm" onClick={() => setShowModal(true)}><Icon path={Icons.plus} size={14} />Nueva categoría</Btn>} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F3F0]">
              <tr>{["Categoría", "Código", "Usa tallas", "Productos", "Estado", "Acciones"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD7]">
              {cats.map(c => {
                const count = products.filter(p => p.categoryId === c.id).length;
                return (
                  <tr key={c.id} className="hover:bg-[#F5F3F0] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{c.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#6B6560]">{c.code}</td>
                    <td className="px-5 py-3.5">{c.usesSizes ? <Badge label="Sí" color="bg-[#E3F2FD] text-[#1565C0]" /> : <span className="text-[#6B6560] text-xs">No</span>}</td>
                    <td className="px-5 py-3.5"><span className="font-semibold text-[#2D6A6A]">{count}</span></td>
                    <td className="px-5 py-3.5"><Badge label={c.status === "active" ? "Activa" : "Inactiva"} color={c.status === "active" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 text-gray-500"} /></td>
                    <td className="px-5 py-3.5">
                      <Btn variant="ghost" size="sm"><Icon path={Icons.edit} size={13} /></Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Nueva categoría" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input label="Nombre de la categoría" value={newCat.name} onChange={v => setNewCat({ ...newCat, name: v })} required placeholder="Ej: Bolsos" />
            <Input label="Código (para SKU)" value={newCat.code} onChange={v => setNewCat({ ...newCat, code: v })} placeholder="Ej: BOL" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newCat.usesSizes} onChange={e => setNewCat({ ...newCat, usesSizes: e.target.checked })} className="accent-[#2D6A6A]" />
              <span className="text-sm text-[#1A1A1A]">Esta categoría utiliza tallas</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={handleAdd}><Icon path={Icons.check} size={14} />Crear categoría</Btn>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

// ─── Programs Screen ──────────────────────────────────────────────────────────
*/
function CategoriesScreen({ products, currentUser }: { products: Product[]; currentUser: AuthenticatedUser }) {
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
    <div className="flex-1 overflow-y-auto p-6"><div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Categoría", "Código", "Usa tallas", "Productos", "Estado", ...(isAdmin ? ["Acciones"] : [])].map((header) => <th key={header} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{loading ? <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-[#6B6560] text-sm">Cargando categorías...</td></tr> : categories.map((category) => <tr key={category.id} className="hover:bg-[#F5F3F0] transition-colors"><td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{category.name}</td><td className="px-5 py-3.5 font-mono text-xs text-[#6B6560]">{category.code}</td><td className="px-5 py-3.5">{category.usesSizes ? <Badge label="Sí" color="bg-[#E3F2FD] text-[#1565C0]" /> : <span className="text-[#6B6560] text-xs">No</span>}</td><td className="px-5 py-3.5"><span className="font-semibold text-[#2D6A6A]">{products.filter((product) => product.categoryId === category.id).length}</span></td><td className="px-5 py-3.5"><Badge label={category.active ? "Activa" : "Inactiva"} color={category.active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 text-gray-500"} /></td>{isAdmin && <td className="px-5 py-3.5 flex gap-1"><Btn variant="ghost" size="sm" onClick={() => edit(category)}><Icon path={Icons.edit} size={13} /></Btn><Btn variant="ghost" size="sm" onClick={() => void toggle(category)}>{category.active ? "Desactivar" : "Activar"}</Btn></td>}</tr>)}</tbody></table></div></div>
    {showModal && <Modal title={selected ? "Editar categoría" : "Nueva categoría"} onClose={close}><div className="space-y-4"><Input label="Nombre de la categoría" value={form.name} onChange={(name) => setForm({ ...form, name })} required /><Input label="Código (para SKU)" value={form.code} onChange={(code) => setForm({ ...form, code })} required /><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.usesSizes} onChange={(event) => setForm({ ...form, usesSizes: event.target.checked })} className="accent-[#2D6A6A]" /><span className="text-sm text-[#1A1A1A]">Esta categoría utiliza tallas</span></label><div className="flex justify-end gap-2 pt-2"><Btn variant="secondary" onClick={close}>Cancelar</Btn><Btn variant="primary" onClick={() => void save()}><Icon path={Icons.check} size={14} />{selected ? "Guardar cambios" : "Crear categoría"}</Btn></div></div></Modal>}
    {message && <Toast message={message} onClose={() => setMessage("")} />}
  </div>;
}

/*function ProgramsScreen({ products }: { products: Product[] }) {
  const [showModal, setShowModal] = useState(false);
  const [programs, setPrograms] = useState<Program[]>(PROGRAMS);
  const [newProg, setNewProg] = useState({ name: "", description: "" });
  const [toast, setToast] = useState("");

  const handleAdd = () => {
    if (!newProg.name) return;
    setPrograms([...programs, { id: `prog${Date.now()}`, name: newProg.name, description: newProg.description, status: "active" }]);
    setShowModal(false);
    setNewProg({ name: "", description: "" });
    setToast("Programa/taller registrado correctamente");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Programas / Talleres" subtitle="Gestión de programas y talleres de origen"
        actions={<Btn variant="primary" size="sm" onClick={() => setShowModal(true)}><Icon path={Icons.plus} size={14} />Nuevo programa/taller</Btn>} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F3F0]">
              <tr>{["Nombre", "Descripción", "Productos", "Estado", "Acciones"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD7]">
              {programs.map(prog => {
                const count = products.filter(p => p.programId === prog.id).length;
                return (
                  <tr key={prog.id} className="hover:bg-[#F5F3F0] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{prog.name}</td>
                    <td className="px-5 py-3.5 text-sm text-[#6B6560]">{prog.description || "—"}</td>
                    <td className="px-5 py-3.5"><span className="font-semibold text-[#2D6A6A]">{count}</span></td>
                    <td className="px-5 py-3.5"><Badge label={prog.status === "active" ? "Activo" : "Inactivo"} color={prog.status === "active" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 text-gray-500"} /></td>
                    <td className="px-5 py-3.5"><Btn variant="ghost" size="sm"><Icon path={Icons.edit} size={13} /></Btn></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Nuevo programa / taller" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input label="Nombre" value={newProg.name} onChange={v => setNewProg({ ...newProg, name: v })} required placeholder="Ej: Programa/Taller 04" />
            <Textarea label="Descripción" value={newProg.description} onChange={v => setNewProg({ ...newProg, description: v })} placeholder="Descripción del programa o taller..." />
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={handleAdd}><Icon path={Icons.check} size={14} />Crear programa</Btn>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

// ─── Movements Screen ─────────────────────────────────────────────────────────
*/
function ProgramsScreen({ products, currentUser }: { products: Product[]; currentUser: AuthenticatedUser }) {
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
    <div className="flex-1 overflow-y-auto p-6"><div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Nombre", "Descripción", "Productos", "Estado", ...(isAdmin ? ["Acciones"] : [])].map((header) => <th key={header} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{loading ? <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-[#6B6560] text-sm">Cargando programas...</td></tr> : programs.map((program) => <tr key={program.id} className="hover:bg-[#F5F3F0] transition-colors"><td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{program.name}</td><td className="px-5 py-3.5 text-sm text-[#6B6560]">{program.description || "—"}</td><td className="px-5 py-3.5"><span className="font-semibold text-[#2D6A6A]">{products.filter((product) => product.programId === program.id).length}</span></td><td className="px-5 py-3.5"><Badge label={program.active ? "Activo" : "Inactivo"} color={program.active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 text-gray-500"} /></td>{isAdmin && <td className="px-5 py-3.5 flex gap-1"><Btn variant="ghost" size="sm" onClick={() => edit(program)}><Icon path={Icons.edit} size={13} /></Btn><Btn variant="ghost" size="sm" onClick={() => void toggle(program)}>{program.active ? "Desactivar" : "Activar"}</Btn></td>}</tr>)}</tbody></table></div></div>
    {showModal && <Modal title={selected ? "Editar programa / taller" : "Nuevo programa / taller"} onClose={close}><div className="space-y-4"><Input label="Nombre" value={form.name} onChange={(name) => setForm({ ...form, name })} required /><Textarea label="Descripción" value={form.description} onChange={(description) => setForm({ ...form, description })} /><div className="flex justify-end gap-2 pt-2"><Btn variant="secondary" onClick={close}>Cancelar</Btn><Btn variant="primary" onClick={() => void save()}><Icon path={Icons.check} size={14} />{selected ? "Guardar cambios" : "Crear programa"}</Btn></div></div></Modal>}
    {message && <Toast message={message} onClose={() => setMessage("")} />}
  </div>;
}

function MovementsScreen({ onNavigate, products, movements }: { onNavigate: (s: Screen) => void; products: Product[]; movements: Movement[] }) {
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = typeFilter ? movements.filter(m => m.type === typeFilter) : movements;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Movimientos de inventario" subtitle="Historial de entradas, salidas y ajustes"
        actions={<Btn variant="primary" size="sm" onClick={() => onNavigate("movement-new")}><Icon path={Icons.plus} size={14} />Registrar movimiento</Btn>} />

      <div className="px-6 py-3 border-b border-[#E2DDD7] bg-white flex items-center gap-3">
        {["", "entrada", "salida", "ajuste"].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${typeFilter === t ? "bg-[#2D6A6A] text-white" : "text-[#6B6560] hover:bg-[#F5F3F0]"}`}>
            {t === "" ? "Todos" : t.charAt(0).toUpperCase() + t.slice(1)}s
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F3F0] sticky top-0">
            <tr>{["Fecha", "Tipo", "SKU", "Producto", "Cantidad", "Usuario", "Motivo", "Estado"].map(h => (
              <th key={h} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-[#E2DDD7]">
            {filtered.map(m => {
              const prod = products.find(p => p.id === m.productId);
              const user = getUserById(m.userId);
              return (
                <tr key={m.id} className="hover:bg-[#F5F3F0] transition-colors bg-white">
                  <td className="px-5 py-3 text-xs text-[#6B6560]">{m.date}</td>
                  <td className="px-5 py-3"><Badge label={getMovTypeLabel(m.type)} color={getMovTypeColor(m.type)} /></td>
                  <td className="px-5 py-3 font-mono text-xs text-[#6B6560]">{m.variantSku}</td>
                  <td className="px-5 py-3 text-xs font-medium text-[#1A1A1A]">{prod?.name || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-semibold ${m.type === "entrada" ? "text-[#2E7D32]" : m.type === "salida" ? "text-[#C62828]" : "text-[#1565C0]"}`}>
                      {m.type === "entrada" ? "+" : m.type === "salida" ? "-" : "±"}{Math.abs(m.quantity)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-[#6B6560]">{user?.name || "—"}</td>
                  <td className="px-5 py-3 text-xs text-[#6B6560]">{m.reason}</td>
                  <td className="px-5 py-3"><Badge label="Completado" color="bg-[#E8F5E9] text-[#2E7D32]" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-2 border-t border-[#E2DDD7] bg-white text-xs text-[#6B6560]">
        {filtered.length} movimientos
      </div>
    </div>
  );
}

// ─── New Movement Screen ──────────────────────────────────────────────────────
function NewMovementScreen({ onNavigate, products, currentUser, onSave }: {
  onNavigate: (s: Screen) => void; products: Product[]; currentUser: { id: string }; onSave: (m: Movement) => void;
}) {
  const [type, setType] = useState<Movement["type"]>("entrada");
  const [productId, setProductId] = useState("");
  const [variantIdx, setVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);

  const selectedProduct = products.find(p => p.id === productId);
  const selectedVariant = selectedProduct?.variants[variantIdx];

  const handleSave = () => {
    if (!productId || !quantity || !reason) return;
    const m: Movement = {
      id: `m${Date.now()}`, date: new Date().toISOString().slice(0, 10),
      type, productId, variantSku: selectedVariant?.sku || "", quantity: parseInt(quantity),
      userId: currentUser.id, reason, status: "completed",
    };
    onSave(m);
    setSaved(true);
  };

  if (saved) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Registrar movimiento" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-4">
            <Icon path={Icons.check} size={28} className="text-[#2E7D32]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1" style={{ fontFamily: "var(--font-display)" }}>Movimiento registrado</h3>
          <p className="text-sm text-[#6B6560] mb-6">El movimiento se registró correctamente</p>
          <div className="flex gap-2 justify-center">
            <Btn variant="secondary" onClick={() => onNavigate("movements")}>Ver movimientos</Btn>
            <Btn variant="primary" onClick={() => onNavigate("inventory")}>Volver al inventario</Btn>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Registrar movimiento" subtitle="Entrada, salida o ajuste de stock"
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => onNavigate("movements")}>Cancelar</Btn>
            <Btn variant="primary" onClick={handleSave} disabled={!productId || !reason}><Icon path={Icons.check} size={14} />Registrar</Btn>
          </div>
        } />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm p-5 space-y-5">
            {/* Type */}
            <div>
              <label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide block mb-2">Tipo de movimiento *</label>
              <div className="flex gap-2">
                {(["entrada", "salida", "ajuste"] as const).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex-1 py-2 rounded text-sm font-medium border transition-all ${type === t ? getMovTypeColor(t) + " border-current" : "border-[#E2DDD7] text-[#6B6560] hover:bg-[#F5F3F0]"}`}>
                    {t === "entrada" ? "📥 Entrada" : t === "salida" ? "📤 Salida" : "⚖️ Ajuste"}
                  </button>
                ))}
              </div>
            </div>

            <Select label="Producto" value={productId} onChange={v => { setProductId(v); setVariantIdx(0); }} required
              options={products.filter(p => p.status !== "inactive").map(p => ({ value: p.id, label: p.name }))} />

            {selectedProduct && selectedProduct.variants.length > 1 && (
              <Select label="Variante" value={String(variantIdx)} onChange={v => setVariantIdx(parseInt(v))} required
                options={selectedProduct.variants.map((v, i) => ({ value: String(i), label: `${v.size ? v.size + " / " : ""}${v.color} — SKU: ${v.sku} (Stock: ${v.stock})` }))} />
            )}

            {selectedVariant && (
              <div className="bg-[#F5F3F0] rounded-lg p-3 text-xs">
                <p className="text-[#6B6560]">SKU: <span className="font-mono text-[#1A1A1A]">{selectedVariant.sku}</span></p>
                <p className="text-[#6B6560] mt-1">Stock actual: <span className="font-bold text-[#1A1A1A]">{selectedVariant.stock} unidades</span></p>
              </div>
            )}

            <Input label="Cantidad" value={quantity} onChange={setQuantity} type="number" placeholder="0" required />
            <Textarea label="Motivo" value={reason} onChange={setReason} placeholder="Ej: Ingreso de nuevos productos, salida para feria, ajuste por daño..." rows={2} />

            <div className="bg-[#E8F4F4] rounded-lg p-3 text-xs text-[#2D6A6A]">
              <Icon path={Icons.alert} size={13} className="inline mr-1" />
              Todo movimiento queda registrado en el historial y no puede eliminarse.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reports Screen ───────────────────────────────────────────────────────────
function ReportsScreen({ products, movements }: { products: Product[]; movements: Movement[] }) {
  const reports = [
    { title: "Inventario actual", description: "Vista completa del stock por producto y variante", icon: Icons.inventory, count: products.length, unit: "productos" },
    { title: "Productos por categoría", description: "Distribución de productos en cada categoría", icon: Icons.categories, count: CATEGORIES.length, unit: "categorías" },
    { title: "Productos por programa/taller", description: "Productos organizados según su taller de origen", icon: Icons.programs, count: PROGRAMS.length, unit: "talleres" },
    { title: "Productos sin stock", description: "Listado de productos agotados que requieren atención", icon: Icons.alert, count: products.filter(p => computeStatus(p) === "out_of_stock").length, unit: "sin stock" },
    { title: "Productos con stock bajo", description: "Productos que requieren reabastecimiento pronto", icon: Icons.arrowDown, count: products.filter(p => computeStatus(p) === "low_stock").length, unit: "con stock bajo" },
    { title: "Historial de movimientos", description: "Registro completo de entradas, salidas y ajustes", icon: Icons.movements, count: movements.length, unit: "movimientos" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Reportes" subtitle="Reportes del módulo de inventario" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4 max-w-3xl">
          {reports.map(r => (
            <div key={r.title} className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm p-5 hover:border-[#2D6A6A] hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-[#E8F4F4] rounded-lg group-hover:bg-[#2D6A6A] transition-colors">
                  <Icon path={r.icon} size={18} className="text-[#2D6A6A] group-hover:text-white transition-colors" />
                </div>
                <span className="text-2xl font-bold text-[#2D6A6A]" style={{ fontFamily: "var(--font-display)" }}>{r.count}</span>
              </div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">{r.title}</h3>
              <p className="text-xs text-[#6B6560]">{r.description}</p>
              <div className="mt-4 pt-3 border-t border-[#E2DDD7]">
                <span className="text-xs text-[#2D6A6A] font-medium">Próximamente: exportación en PDF / Excel</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [movements, setMovements] = useState<Movement[]>(MOVEMENTS);
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

  const handleSaveMovement = (m: Movement) => {
    setMovements(prev => [m, ...prev]);
    setProducts(prev => prev.map(p => {
      if (p.id !== m.productId) return p;
      return {
        ...p, variants: p.variants.map((v, i) => {
          if (v.sku !== m.variantSku) return v;
          const delta = m.type === "entrada" ? m.quantity : m.type === "salida" ? -m.quantity : m.quantity;
          return { ...v, stock: Math.max(0, v.stock + delta) };
        }),
      };
    }));
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
        {screen === "categories" && <CategoriesScreen products={products} currentUser={currentUser!} />}
        {screen === "programs" && <ProgramsScreen products={products} currentUser={currentUser!} />}
        {screen === "movements" && <RealMovementsScreen onNavigate={navigate} onUnauthorized={handleUnauthorized} />}
        {screen === "movement-new" && <RealNewMovementScreen onNavigate={navigate} onUnauthorized={handleUnauthorized} />}
        {screen === "reports" && <ReportsScreen products={products} movements={movements} />}
        {screen === "settings" && <SettingsScreen />}
      </main>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
