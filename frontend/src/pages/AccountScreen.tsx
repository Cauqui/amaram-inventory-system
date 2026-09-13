import { useEffect, useState } from "react";
import { accountApi, ApiError, type AccountUser } from "../lib/api";
import { TopBar } from "../components/layout/TopBar";
import { Badge } from "../components/ui/Badge";
import { Btn } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

type AccountScreenProps = {
  onAccountUpdated: () => Promise<void>;
  onToast: (message: string, type?: "success" | "error") => void;
  onUnauthorized: () => void;
};

function errorMessage(error: unknown, fallback: string, onUnauthorized: () => void) {
  if (error instanceof ApiError) {
    if (error.status === 401) onUnauthorized();
    return error.message || fallback;
  }
  return fallback;
}

export function AccountScreen({ onAccountUpdated, onToast, onUnauthorized }: AccountScreenProps) {
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const load = async () => {
    setLoading(true);
    setProfileError("");
    try {
      const result = await accountApi.get();
      setAccount(result.user);
      setName(result.user.name);
      setEmail(result.user.email);
    } catch (error) {
      setProfileError(errorMessage(error, "No se pudo cargar la información de la cuenta.", onUnauthorized));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const saveProfile = async () => {
    if (profileSaving || !name.trim() || !email.trim()) return;
    setProfileSaving(true);
    setProfileError("");
    try {
      await accountApi.update({ name, email });
      await load();
      await onAccountUpdated();
      onToast("Información de la cuenta actualizada.");
    } catch (error) {
      setProfileError(errorMessage(error, "No se pudo actualizar la cuenta.", onUnauthorized));
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordSaving) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Completa todos los campos de contraseña.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("La confirmación de contraseña no coincide.");
      return;
    }
    setPasswordSaving(true);
    setPasswordError("");
    try {
      await accountApi.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onToast("Contraseña actualizada correctamente.");
    } catch (error) {
      setPasswordError(errorMessage(error, "No se pudo actualizar la contraseña.", onUnauthorized));
    } finally {
      setPasswordSaving(false);
    }
  };

  return <div className="flex-1 flex flex-col overflow-hidden">
    <TopBar title="Mi cuenta" subtitle="Administra tu información personal y seguridad" actions={<Btn variant="secondary" size="sm" onClick={() => void load()}>Recargar</Btn>} />
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {loading && <div className="text-center py-12 text-sm text-[#6B6560]">Cargando información de la cuenta...</div>}
        {!loading && !account && <div className="text-center py-12 space-y-3"><p className="text-sm text-[#C62828]">{profileError}</p><Btn variant="secondary" onClick={() => void load()}>Reintentar</Btn></div>}
        {!loading && account && <>
          <section className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm">
            <div className="px-5 py-4 border-b border-[#E2DDD7]"><h2 className="text-sm font-semibold text-[#1A1A1A]">Información personal</h2></div>
            <div className="p-5 space-y-4">
              {profileError && <p className="rounded border border-[#FFCDD2] bg-[#FFEBEE] px-3 py-2 text-sm text-[#C62828]">{profileError}</p>}
              <Input label="Nombre completo" value={name} onChange={setName} required />
              <Input label="Correo electrónico" type="email" value={email} onChange={setEmail} required />
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-medium text-[#6B6560] uppercase tracking-wide mb-1">Rol</p><p className="rounded border border-[#E2DDD7] bg-[#F5F3F0] px-3 py-2 text-sm text-[#6B6560]">{account.role === "ADMIN" ? "Administrador" : "Personal de inventario"}</p></div>
                <div><p className="text-xs font-medium text-[#6B6560] uppercase tracking-wide mb-2">Estado</p><Badge label={account.active ? "Activo" : "Inactivo"} color={account.active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 text-gray-500"} /></div>
              </div>
              <div className="flex justify-end"><Btn disabled={profileSaving || !name.trim() || !email.trim()} onClick={() => void saveProfile()}>{profileSaving ? "Guardando..." : "Guardar cambios"}</Btn></div>
            </div>
          </section>
          <section className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm">
            <div className="px-5 py-4 border-b border-[#E2DDD7]"><h2 className="text-sm font-semibold text-[#1A1A1A]">Seguridad</h2><p className="text-xs text-[#6B6560] mt-1">Cambia la contraseña de acceso a tu cuenta.</p></div>
            <div className="p-5 space-y-4">
              {passwordError && <p className="rounded border border-[#FFCDD2] bg-[#FFEBEE] px-3 py-2 text-sm text-[#C62828]">{passwordError}</p>}
              <Input label="Contraseña actual" type="password" value={currentPassword} onChange={setCurrentPassword} required />
              <Input label="Nueva contraseña" type="password" value={newPassword} onChange={setNewPassword} required />
              <Input label="Confirmar nueva contraseña" type="password" value={confirmPassword} onChange={setConfirmPassword} required />
              <p className="text-xs text-[#6B6560]">La contraseña debe tener al menos 12 caracteres, una mayúscula, una minúscula, un número y un carácter especial.</p>
              <div className="flex justify-end"><Btn disabled={passwordSaving} onClick={() => void changePassword()}>{passwordSaving ? "Actualizando..." : "Cambiar contraseña"}</Btn></div>
            </div>
          </section>
        </>}
      </div>
    </div>
  </div>;
}
