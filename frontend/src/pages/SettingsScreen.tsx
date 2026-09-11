import { TopBar } from "../components/layout/TopBar";
import { Badge } from "../components/ui/Badge";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../components/ui/icons";

export function SettingsScreen() {
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

