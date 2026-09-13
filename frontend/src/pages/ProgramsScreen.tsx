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

export function ProgramsScreen({ currentUser }: { currentUser: AuthenticatedUser }) {
  const [programs, setPrograms] = useState<ApiProgram[]>([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [selected, setSelected] = useState<ApiProgram | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const isAdmin = currentUser.role === "ADMIN";
  const load = async () => { try { setLoading(true); const result = await programsApi.list(); setPrograms(result.programs); } catch { setMessage("No se pudieron cargar los programas."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const close = () => { setShowModal(false); setSelected(null); setForm({ name: "", description: "" }); };
  const save = async () => { try { const data = { name: form.name, description: form.description.trim() || null }; const result = selected ? await programsApi.update(selected.id, data) : await programsApi.create(data); setPrograms((items) => selected ? items.map((item) => item.id === result.program.id ? result.program : item) : [...items, result.program].sort((a, b) => a.name.localeCompare(b.name))); close(); setMessage("Programa guardado correctamente"); } catch { setMessage("No se pudo guardar el programa."); } };
  const edit = (program: ApiProgram) => { setSelected(program); setForm({ name: program.name, description: program.description || "" }); setShowModal(true); };
  const toggle = async (program: ApiProgram) => { try { const result = await programsApi.update(program.id, { active: !program.active }); setPrograms((items) => items.map((item) => item.id === program.id ? result.program : item)); } catch { setMessage("No se pudo actualizar el programa."); } };
  const normalizedSearch = search.trim().toLowerCase();
  const visiblePrograms = programs.filter((program) => {
    const matchesSearch = !normalizedSearch || program.name.toLowerCase().includes(normalizedSearch) || (program.description || "").toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? program.active : !program.active);
    return matchesSearch && matchesStatus;
  });
  return <div className="flex-1 flex flex-col overflow-hidden">
    <TopBar title="Programas / Talleres" subtitle="Gestión de programas y talleres de origen" actions={isAdmin ? <Btn variant="primary" size="sm" onClick={() => setShowModal(true)}><Icon path={Icons.plus} size={14} />Nuevo programa/taller</Btn> : undefined} />
    <div className="flex-1 overflow-y-auto p-4 sm:p-6"><div className="flex flex-col sm:flex-row gap-3 mb-3"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por programa o descripción..." className="flex-1 border border-[#E2DDD7] rounded px-3 py-2 text-sm bg-white" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border border-[#E2DDD7] rounded px-3 py-2 text-sm bg-white sm:w-36"><option value="ALL">Todos</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option></select></div><div className="bg-white rounded-lg border border-[#E2DDD7] shadow-sm overflow-x-auto"><table className="min-w-[42rem] w-full text-sm"><thead className="bg-[#F5F3F0]"><tr>{["Nombre", "Descripción", "Productos", "Estado", ...(isAdmin ? ["Acciones"] : [])].map((header) => <th key={header} className="text-left px-5 py-3 text-xs font-medium text-[#6B6560] uppercase tracking-wide border-b border-[#E2DDD7]">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#E2DDD7]">{loading ? <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-[#6B6560] text-sm">Cargando programas...</td></tr> : visiblePrograms.length ? visiblePrograms.map((program) => <tr key={program.id} className="hover:bg-[#F5F3F0] transition-colors"><td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{program.name}</td><td className="px-5 py-3.5 text-sm text-[#6B6560]">{program.description || "—"}</td><td className="px-5 py-3.5"><span className="font-semibold text-[#2D6A6A]">{program.productCount}</span></td><td className="px-5 py-3.5"><Badge label={program.active ? "Activo" : "Inactivo"} color={program.active ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-gray-100 text-gray-500"} /></td>{isAdmin && <td className="px-5 py-3.5 flex gap-1"><Btn variant="ghost" size="sm" onClick={() => edit(program)}><Icon path={Icons.edit} size={13} /></Btn><Btn variant="ghost" size="sm" onClick={() => void toggle(program)}>{program.active ? "Desactivar" : "Activar"}</Btn></td>}</tr>) : <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-[#6B6560] text-sm">No se encontraron programas o talleres.</td></tr>}</tbody></table></div></div>
    {showModal && <Modal title={selected ? "Editar programa / taller" : "Nuevo programa / taller"} onClose={close}><div className="space-y-4"><Input label="Nombre" value={form.name} onChange={(name) => setForm({ ...form, name })} required /><Textarea label="Descripción" value={form.description} onChange={(description) => setForm({ ...form, description })} /><div className="flex justify-end gap-2 pt-2"><Btn variant="secondary" onClick={close}>Cancelar</Btn><Btn variant="primary" onClick={() => void save()}><Icon path={Icons.check} size={14} />{selected ? "Guardar cambios" : "Crear programa"}</Btn></div></div></Modal>}
    {message && <Toast message={message} onClose={() => setMessage("")} />}
  </div>;
}

