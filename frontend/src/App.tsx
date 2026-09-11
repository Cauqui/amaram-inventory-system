import { useEffect, useState } from "react";
import { authApi, type ApiProduct, type AuthenticatedUser } from "./lib/api";
import type { Screen } from "./types/navigation";
import { Toast } from "./components/ui/Toast";
import { Sidebar } from "./components/layout/Sidebar";
import { LoginScreen } from "./pages/LoginScreen";
import { AuthLoadingScreen } from "./pages/AuthLoadingScreen";
import { SettingsScreen } from "./pages/SettingsScreen";
import { RealInventoryScreen } from "./pages/InventoryScreen";
import { RealDashboardScreen } from "./pages/DashboardScreen";
import { CategoriesScreen } from "./pages/CategoriesScreen";
import { ProgramsScreen } from "./pages/ProgramsScreen";
import { RealMovementsScreen } from "./pages/MovementsScreen";
import { RealReportsScreen } from "./pages/ReportsScreen";
import { RealProductFormScreen } from "./components/product/ProductForm";
import { RealProductDetailScreen } from "./pages/ProductDetailScreen";
import { RealNewMovementScreen } from "./pages/NewMovementScreen";

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
