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

export function Sidebar({ currentScreen, onNavigate, currentUser, onLogout }: {
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
