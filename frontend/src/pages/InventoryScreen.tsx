import { useEffect, useState } from "react";
import { ApiError, categoriesApi, dashboardApi, productsApi, programsApi, type ApiCategory, type ApiDashboard, type ApiProduct, type ApiProgram, type AuthenticatedUser } from "../lib/api";
import type { Screen } from "../types/navigation";
import { Badge } from "../components/ui/Badge";
import { Btn } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../components/ui/icons";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Textarea } from "../components/ui/Textarea";
import { Toast } from "../components/ui/Toast";
import { StatCard } from "../components/ui/StatCard";
import { TopBar } from "../components/layout/TopBar";
import { ProductPhoto } from "../components/common/ProductPhoto";
import { apiMessage } from "../utils/api-error";
import { getStatusColor, getStatusLabel, productVisualStatus } from "../utils/inventory";

export function RealInventoryScreen({ onNavigate, onUnauthorized }: {
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
    <div className="px-4 sm:px-6 py-3 border-b border-[#E2DDD7] bg-white flex items-center gap-3 flex-wrap">
      <div className="relative w-full sm:flex-1 min-w-0"><Icon path={Icons.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6560]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, SKU, creadora..." className="w-full pl-8 pr-3 py-1.5 border border-[#E2DDD7] rounded text-sm outline-none focus:border-[#2D6A6A] transition-all bg-[#F5F3F0]" /></div>
      <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm text-[#6B6560] bg-[#F5F3F0]"><option value="">Categoría</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select value={programId} onChange={(event) => setProgramId(event.target.value)} className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm text-[#6B6560] bg-[#F5F3F0]"><option value="">Programa</option>{programs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select value={status} onChange={(event) => setStatus(event.target.value)} className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm text-[#6B6560] bg-[#F5F3F0]"><option value="">Estado</option><option value="available">Disponible</option><option value="low_stock">Stock bajo</option><option value="out_of_stock">Sin stock</option><option value="inactive">Inactivo</option></select>
      <input value={color} onChange={(event) => setColor(event.target.value)} placeholder="Color" className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm text-[#6B6560] bg-[#F5F3F0] w-24" />
      {(search || categoryId || programId || status || color) && <Btn variant="ghost" size="sm" onClick={() => { setSearch(""); setCategoryId(""); setProgramId(""); setStatus(""); setColor(""); }}>Limpiar</Btn>}
    </div>
    <div className="flex-1 overflow-auto"><table className="min-w-[42rem] w-full text-sm border-collapse"><thead className="bg-[#F5F3F0] sticky top-0 z-10"><tr>{["Foto", "SKU", "Producto", "Categoría", "Talla", "Color", "Programa/Taller", "Creadora", "Stock", "Estado", "Acciones"].map((header) => <th key={header} className="text-left px-4 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">
      {loading && <tr><td colSpan={11} className="text-center py-12 text-[#6B6560] text-sm">Cargando productos...</td></tr>}
      {!loading && error && <tr><td colSpan={11} className="text-center py-12 text-[#C62828] text-sm">{error}</td></tr>}
      {!loading && !error && filtered.length === 0 && <tr><td colSpan={11} className="text-center py-12 text-[#6B6560] text-sm">No se encontraron productos</td></tr>}
      {!loading && !error && filtered.map((product) => { const visualStatus = productVisualStatus(product); const stock = product.variants.reduce((sum, variant) => sum + variant.stock, 0); return <tr key={product.id} className="hover:bg-[#F5F3F0] transition-colors bg-white"><td className="px-4 py-2.5"><ProductPhoto src={product.images[0]?.secureUrl} alt={product.name} size={32} /></td><td className="px-4 py-2.5 font-mono text-xs text-[#6B6560]">{product.variants.map((variant) => <p key={variant.id}>{variant.sku}</p>)}</td><td className="px-4 py-2.5"><p className="font-medium text-[#1A1A1A] text-xs">{product.name}</p>{product.variants.length > 1 && <p className="text-[10px] text-[#6B6560]">{product.variants.length} variantes</p>}</td><td className="px-4 py-2.5 text-xs text-[#6B6560]">{product.category.name}</td><td className="px-4 py-2.5 text-xs text-[#6B6560]">{product.category.usesSizes ? [...new Set(product.variants.map((variant) => variant.size).filter(Boolean))].join(", ") : "—"}</td><td className="px-4 py-2.5 text-xs text-[#6B6560]">{[...new Set(product.variants.map((variant) => variant.color).filter(Boolean))].join(", ") || "—"}</td><td className="px-4 py-2.5 text-xs text-[#6B6560]">{product.program.name}</td><td className="px-4 py-2.5 text-xs text-[#6B6560]">{product.creatorName}</td><td className="px-4 py-2.5 text-xs font-semibold text-[#1A1A1A]">{stock}</td><td className="px-4 py-2.5"><Badge label={getStatusLabel(visualStatus)} color={getStatusColor(visualStatus)} /></td><td className="px-4 py-2.5"><div className="flex items-center gap-1"><Btn variant="ghost" size="sm" onClick={() => onNavigate("product-detail", product)} className="!px-2"><Icon path={Icons.eye} size={13} /></Btn><Btn variant="ghost" size="sm" onClick={() => onNavigate("product-edit", product)} className="!px-2"><Icon path={Icons.edit} size={13} /></Btn></div></td></tr>; })}
    </tbody></table></div><div className="px-6 py-2 border-t border-[#E2DDD7] bg-white text-xs text-[#6B6560]">Mostrando {filtered.length} de {products.length} productos</div>
  </div>;
}

