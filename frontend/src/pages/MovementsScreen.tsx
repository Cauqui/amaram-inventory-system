import { useEffect, useState } from "react";
import { ApiError, inventoryMovementsApi, reportsApi, type ApiInventoryMovement, type ApiInventoryReport } from "../lib/api";
import type { Screen } from "../types/navigation";
import { Badge } from "../components/ui/Badge";
import { Btn } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../components/ui/icons";
import { StatCard } from "../components/ui/StatCard";
import { TopBar } from "../components/layout/TopBar";
import { movementQuantity, movementQuantityColor, movementTypeColor, movementTypeLabel } from "../utils/movements";
import { isoDateOffset, reportStatusColor, reportStatusLabel } from "../utils/reports";
import { downloadCsv } from "../utils/csv";

export function RealMovementsScreen({ onNavigate, onUnauthorized }: { onNavigate: (screen: Screen) => void; onUnauthorized: () => void }) {
  const [type, setType] = useState<InventoryMovementType | "">("");
  const [search, setSearch] = useState("");
  const [movements, setMovements] = useState<ApiInventoryMovement[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { const result = await inventoryMovementsApi.list({ type: type || undefined }); setMovements(result.movements); } catch (requestError) { setError(apiMessage(requestError, "No se pudo cargar el historial.", onUnauthorized)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [type]);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleMovements = movements.filter((movement) => {
    if (!normalizedSearch) return true;
    return [movement.variant?.sku, movement.product?.name, movement.user?.name, movement.reason]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });
  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Movimientos de inventario" subtitle="Historial de entradas, salidas y ajustes" actions={<div className="flex gap-2"><Btn variant="secondary" size="sm" onClick={() => void load()}>Recargar</Btn><Btn variant="primary" size="sm" onClick={() => onNavigate("movement-new")}><Icon path={Icons.plus} size={14} />Registrar movimiento</Btn></div>} />
    <div className="px-4 sm:px-6 py-3 border-b border-[#E2DDD7] bg-white space-y-3"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por SKU, producto, usuario o motivo..." className="w-full border border-[#E2DDD7] rounded px-3 py-2 text-sm bg-white" /><div className="flex flex-wrap items-center gap-3">{(["", "ENTRY", "EXIT", "ADJUSTMENT"] as const).map((item) => <button key={item} type="button" onClick={() => setType(item)} className={`px-3 py-1 rounded text-xs font-medium transition-all ${type === item ? "bg-[#2D6A6A] text-white" : "text-[#6B6560] hover:bg-[#F5F3F0]"}`}>{item === "" ? "Todos" : movementTypeLabel(item)}</button>)}</div></div>
    <div className="flex-1 overflow-auto"><table className="min-w-[42rem] w-full text-sm"><thead className="bg-[#F5F3F0] sticky top-0"><tr>{["Fecha", "Tipo", "SKU", "Producto", "Cantidad", "Stock", "Usuario", "Motivo"].map((header) => <th key={header} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{loading && <tr><td colSpan={8} className="text-center py-12 text-[#6B6560] text-sm">Cargando movimientos...</td></tr>}{!loading && error && <tr><td colSpan={8} className="text-center py-12 text-[#C62828] text-sm">{error}</td></tr>}{!loading && !error && visibleMovements.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6B6560] text-sm">No se encontraron movimientos.</td></tr>}{!loading && !error && visibleMovements.map((movement) => <tr key={movement.id} className="hover:bg-[#F5F3F0] transition-colors bg-white"><td className="px-5 py-3 text-xs text-[#6B6560]">{new Date(movement.createdAt).toLocaleString("es-PE")}</td><td className="px-5 py-3"><Badge label={movementTypeLabel(movement.type)} color={movementTypeColor(movement.type)} /></td><td className="px-5 py-3 font-mono text-xs text-[#6B6560]">{movement.variant.sku}</td><td className="px-5 py-3 text-xs font-medium text-[#1A1A1A]">{movement.product.name}</td><td className={`px-5 py-3 text-sm font-semibold ${movementQuantityColor(movement)}`}>{movementQuantity(movement)}</td><td className="px-5 py-3 text-xs text-[#6B6560]">{movement.stockBefore} → {movement.stockAfter}</td><td className="px-5 py-3 text-xs text-[#6B6560]">{movement.user.name}</td><td className="px-5 py-3 text-xs text-[#6B6560]">{movement.reason}</td></tr>)}</tbody></table></div><div className="px-6 py-2 border-t border-[#E2DDD7] bg-white text-xs text-[#6B6560]">{visibleMovements.length} movimientos</div>
  </div>;
}

