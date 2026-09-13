import { useEffect, useState } from "react";
import { categoriesApi, productsApi, programsApi, type ApiCategory, type ApiProduct, type ApiProgram, type ProductVariantInput } from "../../lib/api";
import type { Screen } from "../../types/navigation";
import { Btn } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Icons } from "../ui/icons";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { TopBar } from "../layout/TopBar";
import { apiMessage } from "../../utils/api-error";

type VariantDraft = ProductVariantInput & { key: number };

export function RealProductFormScreen({ editProduct, onSaved, onNavigate, onUnauthorized }: {
  editProduct?: ApiProduct; onSaved: (product: ApiProduct) => void; onNavigate: (screen: Screen) => void; onUnauthorized: () => void;
}) {
  const isEdit = !!editProduct;
  const [categories, setCategories] = useState<ApiCategory[]>([]); const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [name, setName] = useState(editProduct?.name || ""); const [description, setDescription] = useState(editProduct?.description || ""); const [history, setHistory] = useState(editProduct?.history || ""); const [creatorName, setCreatorName] = useState(editProduct?.creatorName || "");
  const [categoryId, setCategoryId] = useState(editProduct?.category.id || ""); const [programId, setProgramId] = useState(editProduct?.program.id || ""); const [active, setActive] = useState(editProduct?.active ?? true);
  const [variants, setVariants] = useState<VariantDraft[]>([{ key: 1, size: null, color: null, minimumStock: 0 }]); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { Promise.all([categoriesApi.list(), programsApi.list()]).then(([a, b]) => { setCategories(a.categories); setPrograms(b.programs); }).catch((requestError) => setError(apiMessage(requestError, "No se pudieron cargar los catálogos.", onUnauthorized))); }, []);
  const selectedCategory = categories.find((category) => category.id === categoryId) || editProduct?.category;
  const updateVariant = (key: number, changes: Partial<VariantDraft>) => setVariants((items) => items.map((item) => item.key === key ? { ...item, ...changes } : item));
  const submit = async () => {
    setError("");
    const normalized = variants.map(({ size, color, minimumStock }) => ({ size: selectedCategory?.usesSizes ? size?.trim() || null : null, color: color?.trim() || null, minimumStock }));
    const duplicateKeys = normalized.map((variant) => `${variant.size?.trim().toUpperCase() || "UNI"}:${variant.color?.trim().toUpperCase() || "STD"}`);
    if (!name.trim() || !description.trim() || !creatorName.trim() || !programId || (!isEdit && !categoryId)) return setError("Completa los campos obligatorios.");
    if (!isEdit && selectedCategory?.usesSizes && normalized.some((variant) => !variant.size)) return setError("La talla es obligatoria para esta categoría.");
    if (!isEdit && new Set(duplicateKeys).size !== duplicateKeys.length) return setError("Hay variantes duplicadas.");
    setSaving(true);
    try {
      const result = isEdit
        ? await productsApi.update(editProduct.id, { name, description, history: history.trim() || null, programId, creatorName, active })
        : await productsApi.create({ name, description, history: history.trim() || null, categoryId, programId, creatorName, variants: normalized });
      onSaved(result.product);
    } catch (requestError) { setError(apiMessage(requestError, "No se pudo guardar el producto.", onUnauthorized)); }
    finally { setSaving(false); }
  };
  const availableCategories = categories.filter((item) => item.active || item.id === categoryId); const availablePrograms = programs.filter((item) => item.active || item.id === programId);
  return <div className="flex-1 flex flex-col overflow-hidden"><TopBar title={isEdit ? "Editar producto" : "Nuevo producto"} subtitle={isEdit ? editProduct.name : "Registro de nuevo producto"} actions={<div className="flex gap-2"><Btn variant="secondary" onClick={() => onNavigate("inventory")}>Cancelar</Btn><Btn variant="primary" onClick={() => void submit()}><Icon path={Icons.check} size={14} />{saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar producto"}</Btn></div>} />
    <div className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="max-w-3xl mx-auto space-y-6">
      {error && <div className="bg-[#FFEBEE] border border-[#C62828] text-[#C62828] rounded px-4 py-3 text-sm">{error}</div>}
      <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm"><div className="px-5 py-4 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Información básica</h3></div><div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="col-span-1 sm:col-span-2"><Input label="Nombre del producto" value={name} onChange={setName} required /></div>
        <div className="flex flex-col gap-1"><label className="text-xs font-medium text-[#6B6560] uppercase tracking-wide">Categoría *</label><select disabled={isEdit} value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setVariants((items) => items.map((item) => ({ ...item, size: null }))); }} className="border border-[#E2DDD7] rounded px-3 py-2 text-sm bg-white disabled:bg-[#F5F3F0] disabled:text-[#6B6560]"><option value="">— Seleccionar —</option>{availableCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{isEdit && <span className="text-[10px] text-[#6B6560]">La categoría no puede cambiarse después de generar el SKU.</span>}</div>
        <Select label="Programa / Taller" value={programId} onChange={setProgramId} required options={availablePrograms.map((item) => ({ value: item.id, label: item.name }))} /><div className="col-span-1 sm:col-span-2"><Input label="Creadora / Diseñadora" value={creatorName} onChange={setCreatorName} required /></div><div className="col-span-1 sm:col-span-2"><Textarea label="Descripción del producto" value={description} onChange={setDescription} rows={2} /></div><div className="col-span-1 sm:col-span-2"><Textarea label="Historia del producto" value={history} onChange={setHistory} rows={3} /></div>{isEdit && <label className="col-span-1 sm:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="accent-[#2D6A6A]" />Producto activo</label>}</div></div>
      <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm"><div className="px-5 py-4 border-b border-[#E2DDD7]"><h3 className="text-sm font-semibold text-[#1A1A1A]">Fotografía del producto</h3></div><div className="p-5 flex items-center gap-5"><div className="w-28 h-28 rounded-lg border-2 border-dashed border-[#E2DDD7] bg-[#F5F3F0] flex items-center justify-center"><Icon path={Icons.package} size={24} className="text-[#6B6560]" /></div><p className="text-xs text-[#6B6560]">Después de registrar el producto, gestiona sus fotografías desde el detalle.</p></div></div>
      {!isEdit && <div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm"><div className="px-5 py-4 border-b border-[#E2DDD7] flex justify-between"><div><h3 className="text-sm font-semibold text-[#1A1A1A]">Variantes {selectedCategory?.usesSizes ? "(talla + color)" : "(color)"}</h3><p className="text-[10px] text-[#6B6560] mt-0.5">El backend genera el SKU; el stock inicial será 0</p></div><Btn variant="secondary" size="sm" onClick={() => setVariants((items) => [...items, { key: Date.now(), size: null, color: null, minimumStock: 0 }])}><Icon path={Icons.plus} size={13} />Agregar variante</Btn></div><div className="p-5 space-y-3">{variants.map((variant) => <div key={variant.key} className="grid gap-3 p-3 bg-[#F5F3F0] rounded-lg border border-[#E2DDD7]" style={{ gridTemplateColumns: selectedCategory?.usesSizes ? "1fr 1fr 1fr 1fr auto" : "1fr 1fr 1fr auto" }}><div><label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">SKU</label><div className="border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs font-mono text-[#6B6560] bg-white">Generado al guardar</div></div>{selectedCategory?.usesSizes && <div><label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Talla</label><input value={variant.size || ""} onChange={(event) => updateVariant(variant.key, { size: event.target.value })} className="w-full border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs bg-white" /></div>}<div><label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Color</label><input value={variant.color || ""} onChange={(event) => updateVariant(variant.key, { color: event.target.value })} className="w-full border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs bg-white" /></div><div><label className="text-[10px] font-medium text-[#6B6560] uppercase tracking-wide block mb-1">Stock mínimo</label><input type="number" min={0} value={variant.minimumStock} onChange={(event) => updateVariant(variant.key, { minimumStock: Number(event.target.value) })} className="w-full border border-[#E2DDD7] rounded px-2.5 py-1.5 text-xs bg-white" /></div><div className="flex items-end">{variants.length > 1 && <button onClick={() => setVariants((items) => items.filter((item) => item.key !== variant.key))} className="p-1.5 text-[#C62828] hover:bg-[#FFEBEE] rounded"><Icon path={Icons.x} size={14} /></button>}</div></div>)}</div></div>}
    </div></div>
  </div>;
}

