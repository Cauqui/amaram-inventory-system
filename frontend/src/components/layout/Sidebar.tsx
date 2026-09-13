import { useState } from "react";
import type { AuthenticatedUser } from "../../lib/api";
import type { Screen } from "../../types/navigation";
import { Icon } from "../ui/Icon";
import { Icons } from "../ui/icons";

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

const INVENTORY_ITEMS = ["inventory", "product-new", "categories", "programs"] as const;
const OPERATION_ITEMS = ["movements", "reports"] as const;

export function Sidebar({ currentScreen, onNavigate, currentUser, onLogout }: {
  currentScreen: Screen; onNavigate: (s: Screen) => void; currentUser: AuthenticatedUser; onLogout: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dashboardItem = NAV_ITEMS.find(i => i.id === "dashboard")!;
  const inventoryItems = NAV_ITEMS.filter((item) => INVENTORY_ITEMS.includes(item.id as typeof INVENTORY_ITEMS[number]));
  const operationItems = NAV_ITEMS.filter((item) => OPERATION_ITEMS.includes(item.id as typeof OPERATION_ITEMS[number]));
  const settingsItem = NAV_ITEMS.find(i => i.id === "settings")!;
  const initials = currentUser.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const roleLabel = currentUser.role === "ADMIN" ? "Administrador" : "Personal de inventario";
  const isActive = (id: Screen) => {
    if (id === "product-new") return ["product-new", "product-edit", "product-detail"].includes(currentScreen);
    return currentScreen === id;
  };
  const navigationButtonClass = (id: Screen, extraClassName = "") => `w-full flex items-center rounded text-sm transition-all text-left ${isCollapsed ? "justify-center px-2 py-2" : "gap-2.5 px-3 py-2"} ${isActive(id) ? "bg-[#2D6A6A] text-white font-medium" : "text-white/70 hover:bg-white/8 hover:text-white"} ${extraClassName}`;

  return (
    <aside className={`${isCollapsed ? "w-16" : "w-56"} flex-shrink-0 h-screen flex flex-col bg-[#1B2B2D] text-white overflow-hidden transition-[width] duration-200`}>
      <div className={`${isCollapsed ? "px-2" : "px-5"} pt-5 pb-4 border-b border-white/10`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {isCollapsed ? (
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }} aria-label="AMARAM">A</span>
          ) : (
            <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>AMARAM</h1>
          )}
          {!isCollapsed && <button type="button" onClick={() => setIsCollapsed(true)} aria-label="Contraer menú lateral" title="Contraer menú lateral" className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/8 transition-colors"><Icon path={Icons.chevronRight} size={16} className="rotate-180" /></button>}
        </div>
        {!isCollapsed && <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Sistema de Gestión<br />de Inventario</p>}
        {isCollapsed && <button type="button" onClick={() => setIsCollapsed(false)} aria-label="Expandir menú lateral" title="Expandir menú lateral" className="mt-2 w-full p-1.5 rounded text-white/50 hover:text-white hover:bg-white/8 transition-colors"><Icon path={Icons.chevronRight} size={16} /></button>}
      </div>
      <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-3"} py-4 overflow-y-auto`} aria-label="Navegación principal">
        {[dashboardItem].map(item => (
          <button key={item.id} type="button" onClick={() => onNavigate(item.id as Screen)} aria-label={item.label} title={isCollapsed ? item.label : undefined} className={navigationButtonClass(item.id, "mb-4")}>
            <Icon path={item.icon} size={15} className="flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
        {!isCollapsed && <p className="px-3 pb-1 text-[10px] font-medium tracking-wide text-white/40">INVENTARIO</p>}
        {inventoryItems.map(item => (
          <button key={item.id} type="button" onClick={() => onNavigate(item.id)} aria-label={item.label} title={isCollapsed ? item.label : undefined} className={navigationButtonClass(item.id)}><Icon path={item.icon} size={15} className="flex-shrink-0" />{!isCollapsed && <span>{item.label}</span>}</button>
        ))}
        {!isCollapsed && <p className="px-3 pt-4 pb-1 text-[10px] font-medium tracking-wide text-white/40">OPERACIONES</p>}
        {operationItems.map(item => (
          <button key={item.id} type="button" onClick={() => onNavigate(item.id)} aria-label={item.label} title={isCollapsed ? item.label : undefined} className={navigationButtonClass(item.id)}><Icon path={item.icon} size={15} className="flex-shrink-0" />{!isCollapsed && <span>{item.label}</span>}</button>
        ))}
        {!isCollapsed && <p className="px-3 pt-4 pb-1 text-[10px] font-medium tracking-wide text-white/40">SISTEMA</p>}
        <button type="button" onClick={() => onNavigate(settingsItem.id)} aria-label={settingsItem.label} title={isCollapsed ? settingsItem.label : undefined} className={navigationButtonClass(settingsItem.id)}><Icon path={settingsItem.icon} size={15} className="flex-shrink-0" />{!isCollapsed && <span>{settingsItem.label}</span>}</button>
      </nav>
      <div className={`border-t border-white/10 ${isCollapsed ? "px-2" : "px-3"} py-3`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center gap-1" : "gap-2 px-3"} py-2 mt-1`}>
          <div className="w-7 h-7 rounded-full bg-[#2D6A6A] flex items-center justify-center text-xs font-bold flex-shrink-0" title={isCollapsed ? currentUser.name : undefined}>
            {initials}
          </div>
          {!isCollapsed && <div className="flex-1 min-w-0"><p className="text-xs font-medium text-white truncate">{currentUser.name}</p><p className="text-[10px] text-white/50">{roleLabel}</p></div>}
          <button type="button" onClick={onLogout} aria-label="Cerrar sesión" title={isCollapsed ? "Cerrar sesión" : undefined} className="text-white/40 hover:text-white transition-colors"><Icon path={Icons.logout} size={14} /></button>
        </div>
      </div>
    </aside>
  );
}
