import { useState } from "react";
import { ApiError, authApi, type AuthenticatedUser } from "../lib/api";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../components/ui/icons";

export function LoginScreen({ onLogin }: { onLogin: (user: AuthenticatedUser) => void }) {
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
    <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/amaram-logo.png" alt="AMARAM" className="w-20 h-20 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>AMARAM</h1>
          <p className="text-sm text-[#6B6560] mt-1">Sistema de Gestión de Inventario</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E2DDD7] p-4 sm:p-6">
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
