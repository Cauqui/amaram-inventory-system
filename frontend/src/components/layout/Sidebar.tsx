import { useState } from "react";
import type { AuthenticatedUser } from "../../lib/api";
import type { Screen } from "../../types/navigation";
import { Icon } from "../ui/Icon";
import { Icons } from "../ui/icons";

type NavItem = { id: Screen; label: string; icon: string };

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { id: "inventory", label: "Inventario", icon: Icons.inventory },
  { id: "product-new", label: "Productos", icon: Icons.products },
  { id: "categories", label: "Categorías", icon: Icons.categories },
  { id: "programs", label: "Programas / Talleres", icon: Icons.programs },
  { id: "movements", label: "Movimientos", icon: Icons.movements },
  { id: "reports", label: "Reportes", icon: Icons.reports },
  { id: "settings", label: "Configuración", icon: Icons.settings },
];

const INVENTORY_ITEMS = ["inventory", "product-new", "categories", "programs"] as const;
const OPERATION_ITEMS = ["movements", "reports"] as const;

export function Sidebar({ currentScreen, onNavigate, currentUser, onLogout, mobileOpen, onMobileClose }: {
  currentScreen: Screen; onNavigate: (screen: Screen) => void; currentUser: AuthenticatedUser; onLogout: () => void; mobileOpen: boolean; onMobileClose: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapsed = mobileOpen ? false : isCollapsed;
  const dashboardItem = NAV_ITEMS.find((item) => item.id === "dashboard")!;
  const inventoryItems = NAV_ITEMS.filter((item) => INVENTORY_ITEMS.includes(item.id as typeof INVENTORY_ITEMS[number]));
  const operationItems = NAV_ITEMS.filter((item) => OPERATION_ITEMS.includes(item.id as typeof OPERATION_ITEMS[number]));
  const settingsItem = NAV_ITEMS.find((item) => item.id === "settings")!;
  const initials = currentUser.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const roleLabel = currentUser.role === "ADMIN" ? "Administrador" : "Personal de inventario";
  const isActive = (id: Screen) => id === "product-new" ? ["product-new", "product-edit", "product-detail"].includes(currentScreen) : currentScreen === id;
  const navigate = (screen: Screen) => { onNavigate(screen); onMobileClose(); };
  const navClass = (id: Screen, extra = "") => `w-full flex items-center rounded text-sm transition-all text-left ${collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-3 py-2"} ${isActive(id) ? "bg-[#2D6A6A] text-white font-medium" : "text-white/70 hover:bg-white/8 hover:text-white"} ${extra}`;
  const NavButton = ({ item, extra }: { item: NavItem; extra?: string }) => <button type="button" onClick={() => navigate(item.id)} aria-label={item.label} title={collapsed ? item.label : undefined} className={navClass(item.id, extra)}><Icon path={item.icon} size={15} className="flex-shrink-0" />{!collapsed && <span>{item.label}</span>}</button>;

  return <>
    {mobileOpen && <button type="button" aria-label="Cerrar menú" onClick={onMobileClose} className="fixed inset-0 z-40 bg-black/40 md:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:static md:z-auto md:translate-x-0 ${collapsed ? "md:w-16" : "md:w-56"} flex-shrink-0 h-dvh flex flex-col bg-[#1B2B2D] text-white overflow-hidden transition-[width,transform] duration-200`}>
      <div className={`${collapsed ? "px-2" : "px-5"} pt-5 pb-4 border-b border-white/10`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {collapsed ? <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>A</span> : <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>AMARAM</h1>}
          {!collapsed && <><button type="button" onClick={onMobileClose} aria-label="Cerrar menú" className="md:hidden p-1.5 rounded text-white/50 hover:text-white hover:bg-white/8"><Icon path={Icons.x} size={18} /></button><button type="button" onClick={() => setIsCollapsed(true)} aria-label="Contraer menú lateral" className="hidden md:block p-1.5 rounded text-white/50 hover:text-white hover:bg-white/8"><Icon path={Icons.chevronRight} size={16} className="rotate-180" /></button></>}
        </div>
        {!collapsed && <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Sistema de Gestión<br />de Inventario</p>}
        {collapsed && <button type="button" onClick={() => setIsCollapsed(false)} aria-label="Expandir menú lateral" className="mt-2 w-full p-1.5 rounded text-white/50 hover:text-white hover:bg-white/8"><Icon path={Icons.chevronRight} size={16} /></button>}
      </div>
      <nav className={`flex-1 ${collapsed ? "px-2" : "px-3"} py-4 overflow-y-auto`} aria-label="Navegación principal">
        <NavButton item={dashboardItem} extra="mb-4" />
        {!collapsed && <p className="px-3 pb-1 text-[10px] font-medium tracking-wide text-white/40">INVENTARIO</p>}
        {inventoryItems.map((item) => <NavButton key={item.id} item={item} />)}
        {!collapsed && <p className="px-3 pt-4 pb-1 text-[10px] font-medium tracking-wide text-white/40">OPERACIONES</p>}
        {operationItems.map((item) => <NavButton key={item.id} item={item} />)}
        {!collapsed && <p className="px-3 pt-4 pb-1 text-[10px] font-medium tracking-wide text-white/40">SISTEMA</p>}
        <NavButton item={settingsItem} />
      </nav>
      <div className={`border-t border-white/10 ${collapsed ? "px-2" : "px-3"} py-3`}><div className={`flex items-center ${collapsed ? "justify-center gap-1" : "gap-2 px-3"} py-2 mt-1`}><div className="w-7 h-7 rounded-full bg-[#2D6A6A] flex items-center justify-center text-xs font-bold flex-shrink-0">{initials}</div>{!collapsed && <div className="flex-1 min-w-0"><p className="text-xs font-medium text-white truncate">{currentUser.name}</p><p className="text-[10px] text-white/50">{roleLabel}</p></div>}<button type="button" onClick={() => { onMobileClose(); onLogout(); }} aria-label="Cerrar sesión" className="text-white/40 hover:text-white"><Icon path={Icons.logout} size={14} /></button></div></div>
    </aside>
  </>;
}
