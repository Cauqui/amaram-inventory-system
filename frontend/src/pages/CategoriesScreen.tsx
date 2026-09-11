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

export function CategoriesScreen({ currentUser }: { currentUser: AuthenticatedUser }) {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [form, setForm] = useState({ name: "", code: "", usesSizes: false });
  const [selected, setSelected] = useState<ApiCategory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const isAdmin = currentUser.role === "ADMIN";
  const load = async () => { try { setLoading(true); const result = await categoriesApi.list(); setCategories(result.categories); } catch { setMessage("No se pudieron cargar las categorías."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const close = () => { setShowModal(false); setSelected(null); setForm({ name: "", code: "", usesSizes: false }); };
  const save = async () => { try { const result = selected ? await categoriesApi.update(selected.id, form) : await categoriesApi.create(form); setCategories((items) => selected ? items.map((item) => item.id === result.category.id ? result.category : item) : [...items, result.category].sort((a, b) => a.name.localeCompare(b.name))); close(); setMessage("Categoría guardada correctamente"); } catch (error) { setMessage(error instanceof ApiError && error.status === 409 ? "El código de categoría ya existe." : "No se pudo guardar la categoría."); } };
  const edit = (category: ApiCategory) => { setSelected(category); setForm({ name: category.name, code: category.code, usesSizes: category.usesSizes }); setShowModal(true); };
  const toggle = async (category: ApiCategory) => { try { const result = await categoriesApi.update(category.id, { active: !category.active }); setCategories((items) => items.map((item) => item.id === category.id ? result.category : item)); } catch { setMessage("No se pudo actualizar la categoría."); } };
  return <div className="flex-1 flex flex-col overflow-hidden">
    <TopBar title="Categorías de productos" subtitle="Gestión de categorías del inventario" actions={isAdmin ? <Btn variant="primary" size="sm" onClick={() => setShowModal(true)}><Icon path={Icons.plus} size={14} />Nueva categoría</Btn> : undefined} />
    <div className="flex-1 overflow-y-auto p-6"><div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Categoría", "Código", "Usa tallas", "Productos", "Estado", ...(isAdmin ? ["Acciones"] : [])].map((header) => <th key={header} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{loading ? <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-[#6B6560] text-sm">Cargando categorías...</td></tr> : categories.map((category) => <tr key={category.id} className="hover:bg-[#F5F3F0] transition-colors"><td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{category.name}</td><td className="px-5 py-3.5 font-mono text-xs text-[#6B6560]">{category.code}</td><td className="px-5 py-3.5">{category.usesSizes ? <Badge label="Sí" color="bg-[#E3F2FD] text-[#1565C0]" /> : <span className="text-[#6B6560] text-xs">No</span>}</td><td className="px-5 py-3.5"><span className="font-semibold text-[#2D6A6A]">{category.productCount}</span></td><td className="px-5 py-3.5"><Badge label={category.active ? "Activa" : "Inactiva"} color={category.active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 text-gray-500"} /></td>{isAdmin && <td className="px-5 py-3.5 flex gap-1"><Btn variant="ghost" size="sm" onClick={() => edit(category)}><Icon path={Icons.edit} size={13} /></Btn><Btn variant="ghost" size="sm" onClick={() => void toggle(category)}>{category.active ? "Desactivar" : "Activar"}</Btn></td>}</tr>)}</tbody></table></div></div>
    {showModal && <Modal title={selected ? "Editar categoría" : "Nueva categoría"} onClose={close}><div className="space-y-4"><Input label="Nombre de la categoría" value={form.name} onChange={(name) => setForm({ ...form, name })} required /><Input label="Código (para SKU)" value={form.code} onChange={(code) => setForm({ ...form, code })} required /><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.usesSizes} onChange={(event) => setForm({ ...form, usesSizes: event.target.checked })} className="accent-[#2D6A6A]" /><span className="text-sm text-[#1A1A1A]">Esta categoría utiliza tallas</span></label><div className="flex justify-end gap-2 pt-2"><Btn variant="secondary" onClick={close}>Cancelar</Btn><Btn variant="primary" onClick={() => void save()}><Icon path={Icons.check} size={14} />{selected ? "Guardar cambios" : "Crear categoría"}</Btn></div></div></Modal>}
    {message && <Toast message={message} onClose={() => setMessage("")} />}
  </div>;
}

