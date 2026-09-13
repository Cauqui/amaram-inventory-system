import { TopBar } from "../components/layout/TopBar";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../components/ui/icons";
import type { AuthenticatedUser } from "../lib/api";
import type { Screen } from "../types/navigation";

export function SettingsScreen({ currentUser, onNavigate }: { currentUser: AuthenticatedUser; onNavigate?: (screen: Screen) => void }) {
  const sections = [
    ...(currentUser.role === "ADMIN" ? [{ title: "Usuarios", description: "Gestión de cuentas y permisos del sistema", icon: Icons.user }] : []),
    { title: "Mi cuenta", description: "Información personal y seguridad", icon: Icons.settings },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Configuración" subtitle="Opciones del sistema AMARAM" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-3">
          {sections.map(s => (
            <button key={s.title} type="button" onClick={() => onNavigate?.(s.title === "Usuarios" ? "users" : "account")} className="w-full text-left bg-white rounded-lg border border-[#E2DDD7] p-4 shadow-sm flex items-center gap-4 hover:border-[#2D6A6A] transition-all">
              <div className="p-2 rounded-lg bg-[#F5F3F0]">
                <Icon path={s.icon} size={18} className="text-[#6B6560]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1A1A1A]">{s.title}</p>
                <p className="text-xs text-[#6B6560]">{s.description}</p>
              </div>
              <Icon path={Icons.chevronRight} size={16} className="text-[#6B6560]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
