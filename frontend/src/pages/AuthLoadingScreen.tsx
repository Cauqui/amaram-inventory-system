export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm text-center">
        <img src="/amaram-logo.png" alt="AMARAM" className="w-20 h-20 object-contain mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>AMARAM</h1>
        <p className="text-sm text-[#6B6560] mt-2">Comprobando sesión...</p>
      </div>
    </div>
  );
}
