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
import { downloadCsv, localFileTimestamp } from "../utils/csv";

function reportsMessage(error: unknown, onUnauthorized: () => void) {
  if (error instanceof ApiError && error.status === 401) {
    onUnauthorized();
    return "La sesión expiró. Inicia sesión nuevamente.";
  }
  if (error instanceof ApiError && error.status === 400) return "Verifica que las fechas sean válidas y no superen un año.";
  if (error instanceof ApiError && error.status === 403) return "No tienes permiso para consultar reportes.";
  if (error instanceof ApiError && error.status >= 500) return "No se pudieron generar los reportes. Intenta nuevamente.";
  return "No se pudo conectar con el servidor de reportes.";
}

export function RealReportsScreen({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [from, setFrom] = useState(() => isoDateOffset(-29));
  const [to, setTo] = useState(() => isoDateOffset(0));
  const [report, setReport] = useState<ApiInventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (requestedFrom = from, requestedTo = to) => {
    setLoading(true); setError("");
    try { setReport(await reportsApi.inventory({ from: requestedFrom, to: requestedTo })); }
    catch (requestError) { setError(reportsMessage(requestError, onUnauthorized)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const reset = () => { const nextFrom = isoDateOffset(-29); const nextTo = isoDateOffset(0); setFrom(nextFrom); setTo(nextTo); void load(nextFrom, nextTo); };
  const exportStock = () => {
    if (!report) return;
    downloadCsv(`amaram-stock-${localFileTimestamp()}.csv`, ["Producto", "SKU base", "SKU variante", "Categoría", "Programa", "Creadora", "Talla", "Color", "Stock", "Stock mínimo", "Estado"], report.stock.map((row) => [row.productName, row.skuBase, row.sku, row.categoryName, row.programName, row.creatorName, row.size || "-", row.color || "-", row.stock, row.minimumStock, reportStatusLabel(row.status)]));
  };
  const exportMovements = () => {
    if (!report) return;
    downloadCsv(`amaram-movimientos-${localFileTimestamp()}.csv`, ["Fecha", "Tipo", "Producto", "SKU base", "SKU variante", "Talla", "Color", "Cantidad", "Stock anterior", "Stock posterior", "Usuario", "Motivo"], report.movements.map((row) => [new Date(row.createdAt).toLocaleString("es-PE"), movementTypeLabel(row.type), row.productName, row.skuBase, row.variantSku, row.size || "-", row.color || "-", row.type === "EXIT" ? -row.quantity : row.quantity, row.stockBefore, row.stockAfter, row.userName, row.reason]));
  };

  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Reportes" subtitle="Resumen operativo de inventario" actions={<div className="flex gap-2"><Btn variant="secondary" size="sm" disabled={!report} onClick={exportStock}>Exportar stock CSV</Btn><Btn variant="secondary" size="sm" disabled={!report} onClick={exportMovements}>Exportar movimientos CSV</Btn></div>} />
    <div className="px-4 sm:px-6 py-3 border-b border-[#E2DDD7] bg-white flex items-end gap-3 flex-wrap"><div className="flex flex-col gap-1"><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">Fecha desde</label><input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm bg-[#F5F3F0]" /></div><div className="flex flex-col gap-1"><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">Fecha hasta</label><input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-sm bg-[#F5F3F0]" /></div><Btn variant="primary" size="sm" disabled={loading || !from || !to} onClick={() => void load()}>Aplicar filtros</Btn><Btn variant="ghost" size="sm" disabled={loading} onClick={reset}>Restablecer</Btn>{report && <p className="text-[10px] text-[#6B6560] mb-1">Período UTC inclusivo: {report.period.from} a {report.period.to}</p>}</div>
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">{loading && <div className="text-center py-12 text-sm text-[#6B6560]">Cargando reportes...</div>}{!loading && error && <div className="text-center py-12 space-y-3"><p className="text-sm text-[#C62828]">{error}</p><Btn variant="secondary" onClick={() => void load()}>Reintentar</Btn></div>}{!loading && report && <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><StatCard label="Productos activos" value={report.summary.activeProducts} icon={Icons.products} color="primary" /><StatCard label="Stock total" value={report.summary.totalStock} icon={Icons.inventory} color="success" /><StatCard label="Stock bajo" value={report.summary.lowStockVariants} icon={Icons.alert} color="warning" /><StatCard label="Sin stock" value={report.summary.outOfStockVariants} icon={Icons.x} color="danger" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5"><div className="col-span-1 lg:col-span-2 bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><div className="px-5 py-3.5 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Stock actual por variante</h3><p className="text-[10px] text-[#6B6560]">{report.stock.length} variantes activas de productos activos</p></div><div className="overflow-x-auto"><table className="min-w-[42rem] w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Producto", "SKU", "Categoría", "Talla / Color", "Stock", "Mínimo", "Estado"].map((header) => <th key={header} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B6560] uppercase whitespace-nowrap">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{report.stock.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-xs text-[#6B6560]">No hay variantes activas para mostrar</td></tr>}{report.stock.map((row) => <tr key={row.variantId}><td className="px-4 py-2 text-xs font-medium text-[#1A1A1A]">{row.productName}</td><td className="px-4 py-2 font-mono text-xs text-[#6B6560]">{row.sku}</td><td className="px-4 py-2 text-xs text-[#6B6560]">{row.categoryName}</td><td className="px-4 py-2 text-xs text-[#6B6560]">{row.size || "-"} / {row.color || "-"}</td><td className="px-4 py-2 text-xs font-semibold">{row.stock}</td><td className="px-4 py-2 text-xs">{row.minimumStock}</td><td className="px-4 py-2"><Badge label={reportStatusLabel(row.status)} color={reportStatusColor(row.status)} /></td></tr>)}</tbody></table></div></div>
        <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><div className="px-5 py-3.5 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Alertas de stock</h3></div><div className="p-4 space-y-2.5">{report.alerts.length === 0 && <p className="py-4 text-center text-xs text-[#6B6560]">Sin alertas activas</p>}{report.alerts.map((alert) => <div key={alert.sku} className={`p-3 rounded-lg border ${alert.status === "OUT_OF_STOCK" ? "bg-[#FFEBEE] border-[#FFCDD2]" : "bg-[#FDF3E7] border-[#FDDCAA]"}`}><p className="text-xs font-medium text-[#1A1A1A]">{alert.productName}</p><p className="font-mono text-[10px] text-[#6B6560] mt-0.5">{alert.sku}</p><p className={`text-[10px] mt-1 ${alert.status === "OUT_OF_STOCK" ? "text-[#C62828]" : "text-[#C4813A]"}`}>{alert.status === "OUT_OF_STOCK" ? "Sin stock" : `Stock bajo (${alert.stock}/${alert.minimumStock})`}</p></div>)}</div></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5"><div className="col-span-1 lg:col-span-2 bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><div className="px-5 py-3.5 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Movimientos del período</h3><p className="text-[10px] text-[#6B6560]">{report.summary.totalMovementsInPeriod} movimientos · {report.movementSummary.entryMovementCount} entradas / {report.movementSummary.exitMovementCount} salidas / {report.movementSummary.adjustmentMovementCount} ajustes</p></div><div className="overflow-x-auto"><table className="min-w-[42rem] w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Fecha", "Tipo", "Producto", "SKU", "Cantidad", "Stock", "Usuario"].map((header) => <th key={header} className="text-left px-4 py-2.5 text-xs font-medium text-[#6B6560] uppercase whitespace-nowrap">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{report.movements.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-xs text-[#6B6560]">No hay movimientos en este período</td></tr>}{report.movements.map((movement) => { const quantity = movement.type === "EXIT" ? -movement.quantity : movement.quantity; return <tr key={movement.id}><td className="px-4 py-2 text-xs text-[#6B6560] whitespace-nowrap">{new Date(movement.createdAt).toLocaleString("es-PE")}</td><td className="px-4 py-2"><Badge label={movementTypeLabel(movement.type)} color={movementTypeColor(movement.type)} /></td><td className="px-4 py-2 text-xs font-medium">{movement.productName}</td><td className="px-4 py-2 font-mono text-xs text-[#6B6560]">{movement.variantSku}</td><td className={`px-4 py-2 text-xs font-semibold ${quantity >= 0 ? "text-[#2E7D32]" : "text-[#C62828]"}`}>{quantity > 0 ? "+" : ""}{quantity}</td><td className="px-4 py-2 text-xs">{movement.stockBefore} → {movement.stockAfter}</td><td className="px-4 py-2 text-xs text-[#6B6560]">{movement.userName}</td></tr>; })}</tbody></table></div></div>
        <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm p-5 space-y-3"><h3 className="text-sm font-semibold text-[#1A1A1A]">Resumen de movimientos</h3><div className="text-xs text-[#6B6560] space-y-2"><p>Entradas: <strong className="text-[#1A1A1A]">{report.movementSummary.entryMovementCount}</strong> · <strong className="text-[#2E7D32]">+{report.movementSummary.entryUnits} unidades</strong></p><p>Salidas: <strong className="text-[#1A1A1A]">{report.movementSummary.exitMovementCount}</strong> · <strong className="text-[#C62828]">-{report.movementSummary.exitUnits} unidades</strong></p><p>Ajustes: <strong className="text-[#1A1A1A]">{report.movementSummary.adjustmentMovementCount}</strong> · <strong className="text-[#1565C0]">{report.movementSummary.adjustmentNetUnits > 0 ? "+" : ""}{report.movementSummary.adjustmentNetUnits} netas</strong></p></div><div className="pt-3 border-t border-[#E2DDD7]"><p className="text-[10px] uppercase tracking-wide text-[#6B6560] mb-2">Stock por categoría</p>{report.categoryDistribution.map((category) => <div key={category.categoryId} className="flex justify-between text-xs text-[#6B6560] py-1"><span>{category.categoryName}</span><span>{category.totalStock} · {category.variantCount} var.</span></div>)}</div></div></div>
    </>}</div>
  </div>;
}
