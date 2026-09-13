import { useEffect, useState } from "react";
import { ApiError, inventoryMovementsApi, productsApi, productVariantsApi, type ApiProduct, type InventoryMovementType } from "../lib/api";
import type { Screen } from "../types/navigation";
import { Btn } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Icons } from "../components/ui/icons";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { TopBar } from "../components/layout/TopBar";
import { apiMessage } from "../utils/api-error";
import { movementTypeColor, movementTypeLabel } from "../utils/movements";

export function RealNewMovementScreen({ onNavigate, onUnauthorized }: { onNavigate: (screen: Screen) => void; onUnauthorized: () => void }) {
  const [products, setProducts] = useState<ApiProduct[]>([]); const [productId, setProductId] = useState(""); const [variantId, setVariantId] = useState(""); const [type, setType] = useState<InventoryMovementType>("ENTRY"); const [quantity, setQuantity] = useState("1"); const [targetStock, setTargetStock] = useState(""); const [reason, setReason] = useState(""); const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID()); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  useEffect(() => { productsApi.list({ active: true }).then((result) => setProducts(result.products)).catch((requestError) => setError(apiMessage(requestError, "No se pudieron cargar los productos.", onUnauthorized))); }, []);
  const product = products.find((item) => item.id === productId); const variants = product?.variants.filter((item) => item.active) || []; const selectedVariant = variants.find((item) => item.id === variantId);
  const selectProduct = (id: string) => { setProductId(id); setVariantId(""); setError(""); };
  const [scanSku, setScanSku] = useState(""); const [scanLoading, setScanLoading] = useState(false); const [scanMessage, setScanMessage] = useState("");
  const findScannedVariant = async () => {
    const sku = scanSku.trim();
    if (!sku) return setScanMessage("Escribe o escanea un SKU.");
    setScanLoading(true); setScanMessage(""); setError("");
    try {
      const lookup = await productVariantsApi.findBySku(sku);
      const result = await productsApi.get(lookup.product.id);
      setProducts((items) => [result.product, ...items.filter((item) => item.id !== result.product.id)]);
      setProductId(result.product.id); setVariantId(lookup.variant.id); setScanSku(lookup.variant.sku);
      setScanMessage(`Encontrado: ${lookup.product.name} · ${lookup.variant.sku}`);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 404) setScanMessage("No se encontró una variante con este código.");
      else if (requestError instanceof ApiError && requestError.status === 400) setScanMessage("El SKU no tiene un formato válido.");
      else setError(apiMessage(requestError, "No se pudo buscar el SKU.", onUnauthorized));
    } finally { setScanLoading(false); }
  };
  const submit = async () => {
    setError(""); if (!selectedVariant || !reason.trim()) return setError("Selecciona una variante e ingresa un motivo.");
    const parsedQuantity = Number(quantity); const parsedTarget = Number(targetStock);
    if ((type === "ENTRY" || type === "EXIT") && (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0)) return setError("La cantidad debe ser un entero mayor que cero.");
    if (type === "EXIT" && parsedQuantity > selectedVariant.stock) return setError("Stock insuficiente para realizar la salida.");
    if (type === "ADJUSTMENT" && (!Number.isInteger(parsedTarget) || parsedTarget < 0)) return setError("El stock físico debe ser un entero igual o mayor que cero.");
    if (type === "ADJUSTMENT" && parsedTarget === selectedVariant.stock) return setError("El stock contado coincide con el stock registrado.");
    setSaving(true);
    try {
      const data = type === "ADJUSTMENT" ? { variantId: selectedVariant.id, type, targetStock: parsedTarget, reason: reason.trim(), idempotencyKey } : { variantId: selectedVariant.id, type, quantity: parsedQuantity, reason: reason.trim(), idempotencyKey };
      await inventoryMovementsApi.create(data); setSaved(true); setReason(""); setQuantity("1"); setTargetStock(""); setIdempotencyKey(crypto.randomUUID());
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 422) setError("Stock insuficiente para realizar la salida.");
      else if (requestError instanceof ApiError && requestError.status === 409) setError("El producto o variante ya no está disponible para movimientos.");
      else if (requestError instanceof ApiError && requestError.status === 400 && type === "ADJUSTMENT") setError("El stock contado coincide con el stock registrado.");
      else setError(apiMessage(requestError, "No se pudo registrar el movimiento.", onUnauthorized));
    } finally { setSaving(false); }
  };
  if (saved) return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Registrar movimiento" /><div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-4"><Icon path={Icons.check} size={28} className="text-[#2E7D32]" /></div><h3 className="text-lg font-semibold text-[#1A1A1A] mb-1" style={{ fontFamily: "var(--font-display)" }}>Movimiento registrado</h3><p className="text-sm text-[#6B6560] mb-6">El movimiento se registró correctamente</p><div className="flex gap-2 justify-center"><Btn variant="secondary" onClick={() => onNavigate("movements")}>Ver movimientos</Btn><Btn variant="primary" onClick={() => onNavigate("inventory")}>Volver al inventario</Btn></div></div></div></div>;
  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title="Registrar movimiento" subtitle="Entrada, salida o ajuste de stock" actions={<div className="flex gap-2"><Btn variant="secondary" onClick={() => onNavigate("movements")}>Cancelar</Btn><Btn variant="primary" onClick={() => void submit()} disabled={saving || !variantId || !reason.trim()}><Icon path={Icons.check} size={14} />{saving ? "Registrando..." : "Registrar"}</Btn></div>} />
    <div className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="max-w-xl mx-auto"><div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm p-5 space-y-5">{error && <div className="bg-[#FFEBEE] border border-[#C62828] text-[#C62828] rounded px-3 py-2 text-sm">{error}</div>}<form onSubmit={(event) => { event.preventDefault(); void findScannedVariant(); }} className="rounded-lg border border-[#E2DDD7] bg-[#F5F3F0] p-3"><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Escanear o escribir SKU</label><div className="flex gap-2"><input autoFocus value={scanSku} onChange={(event) => setScanSku(event.target.value)} placeholder="Ej: AMA-CAN-0001-UNI-ARC" className="min-w-0 flex-1 border border-[#E2DDD7] rounded px-3 py-2 text-sm font-mono bg-white outline-none focus:border-[#2D6A6A]" /><button type="submit" disabled={scanLoading} className="inline-flex items-center rounded border border-[#E2DDD7] bg-white px-2.5 py-1 text-xs font-medium text-[#1A1A1A] disabled:opacity-50">{scanLoading ? "Buscando..." : "Buscar"}</button></div>{scanMessage && <p className={`mt-2 text-xs ${scanMessage.startsWith("Encontrado:") ? "text-[#2E7D32]" : "text-[#C62828]"}`}>{scanMessage}</p>}</form><div><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide block mb-2">Tipo de movimiento *</label><div className="flex gap-2">{(["ENTRY", "EXIT", "ADJUSTMENT"] as const).map((item) => <button key={item} onClick={() => { setType(item); setError(""); }} className={`flex-1 py-2 rounded text-sm font-medium border transition-all ${type === item ? movementTypeColor(item) + " border-current" : "border-[#E2DDD7] text-[#6B6560] hover:bg-[#F5F3F0]"}`}>{movementTypeLabel(item)}</button>)}</div></div><Select label="Producto" value={productId} onChange={selectProduct} required options={products.map((item) => ({ value: item.id, label: `${item.name} — ${item.skuBase}` }))} />{product && <Select label="Variante" value={variantId} onChange={setVariantId} required options={variants.map((item) => ({ value: item.id, label: `${item.sku} — ${item.size ? `Talla ${item.size} — ` : ""}${item.color || "Sin color"} — Stock ${item.stock}` }))} />}{selectedVariant && <div className="bg-[#F5F3F0] rounded-lg p-3 text-xs"><p className="text-[#6B6560]">SKU: <span className="font-mono text-[#1A1A1A]">{selectedVariant.sku}</span></p><p className="text-[#6B6560] mt-1">Stock actual: <span className="font-bold text-[#1A1A1A]">{selectedVariant.stock} unidades</span></p></div>}{type === "ADJUSTMENT" ? <><p className="text-xs text-[#6B6560]">Stock registrado actualmente: <strong>{selectedVariant?.stock ?? 0}</strong></p><Input label="Stock físico contado" type="number" value={targetStock} onChange={setTargetStock} required /></> : <Input label={type === "ENTRY" ? "Cantidad de entrada" : "Cantidad de salida"} type="number" value={quantity} onChange={setQuantity} required />}<Textarea label="Motivo" value={reason} onChange={setReason} placeholder="Ej: Ingreso de nuevos productos, salida para feria, ajuste por daño..." rows={2} /><div className="bg-[#E8F4F4] rounded-lg p-3 text-xs text-[#2D6A6A]"><Icon path={Icons.alert} size={13} className="inline mr-1" />Todo movimiento queda registrado en el historial y no puede eliminarse.</div></div></div></div>
  </div>;
}

