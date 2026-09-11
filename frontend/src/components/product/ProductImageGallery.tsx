import { useEffect, useRef, useState } from "react";
import { ApiError, productImagesApi, type ApiProduct, type ApiProductImage } from "../../lib/api";
import { Btn } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Icons } from "../ui/icons";

function productImageMessage(error: unknown, onUnauthorized: () => void) {
  if (error instanceof ApiError && error.status === 401) {
    onUnauthorized();
    return "La sesión expiró. Inicia sesión nuevamente.";
  }
  if (error instanceof ApiError && error.status === 400) return "Selecciona una imagen JPG, PNG o WebP válida.";
  if (error instanceof ApiError && error.status === 403) return "No tienes permiso para gestionar imágenes.";
  if (error instanceof ApiError && error.status === 404) return "El producto o la imagen ya no existe.";
  if (error instanceof ApiError && error.status === 409) return "El producto está inactivo o ya tiene el máximo de 5 imágenes.";
  if (error instanceof ApiError && error.status === 413) return "La imagen no puede superar 5 MB.";
  return "No se pudo completar la operación con la imagen.";
}

export function ProductImageGallery({ product, onUnauthorized }: { product: ApiProduct; onUnauthorized: () => void }) {
  const initialImages = () => product.images.map((image) => ({ ...image, productId: product.id }));
  const [images, setImages] = useState<ApiProductImage[]>(() => initialImages().sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)));
  const [selectedId, setSelectedId] = useState<string | null>(product.images[0]?.id ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const setImageList = (next: ApiProductImage[], preferredId?: string | null) => {
    const ordered = [...next].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
    setImages(ordered);
    setSelectedId((current) => preferredId && ordered.some((image) => image.id === preferredId)
      ? preferredId
      : ordered.some((image) => image.id === current) ? current : ordered[0]?.id ?? null);
  };
  const refresh = async (preferredId?: string | null) => {
    const result = await productImagesApi.list(product.id);
    setImageList(result.images, preferredId);
  };
  useEffect(() => { void refresh().catch((requestError) => setError(productImageMessage(requestError, onUnauthorized))); }, [product.id]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const selectFile = (file: File | undefined) => {
    setError(""); setNotice("");
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError("Selecciona una imagen JPG, PNG o WebP.");
    if (file.size > 5 * 1024 * 1024) return setError("La imagen no puede superar 5 MB.");
    if (images.length >= 5) return setError("Este producto ya tiene el máximo de 5 imágenes.");
    setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file));
  };
  const clearSelection = () => {
    setSelectedFile(null); setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };
  const upload = async () => {
    if (!selectedFile || loading || !product.active) return;
    setLoading(true); setError(""); setNotice("");
    try {
      const result = await productImagesApi.upload(product.id, selectedFile);
      await refresh(result.image.id);
      clearSelection();
      setNotice("Imagen subida correctamente.");
    } catch (requestError) { setError(productImageMessage(requestError, onUnauthorized)); }
    finally { setLoading(false); }
  };
  const remove = async () => {
    const selected = images.find((image) => image.id === selectedId);
    if (!selected || removingId) return;
    if (!window.confirm("¿Eliminar esta imagen del producto?")) return;
    setRemovingId(selected.id); setError(""); setNotice("");
    try {
      await productImagesApi.remove(product.id, selected.id);
      await refresh();
      setNotice("Imagen eliminada correctamente.");
    } catch (requestError) { setError(productImageMessage(requestError, onUnauthorized)); }
    finally { setRemovingId(null); }
  };

  const selected = images.find((image) => image.id === selectedId) ?? images[0];
  const visibleUrl = previewUrl ?? selected?.secureUrl;
  return <div className="bg-white rounded-lg border border-[#E2DDD7] p-4 shadow-sm flex flex-col gap-3"><div className="w-full aspect-square rounded-lg bg-[#F5F3F0] overflow-hidden flex items-center justify-center">{visibleUrl ? <img src={visibleUrl} alt={selectedFile ? `Vista previa de ${selectedFile.name}` : product.name} className="w-full h-full object-cover" /> : <Icon path={Icons.package} size={32} className="text-[#6B6560]" />}</div>
    {images.length > 0 && <div className="grid grid-cols-5 gap-1.5">{images.map((image) => <button key={image.id} type="button" aria-label={`Ver imagen ${image.position} de ${product.name}`} onClick={() => { setSelectedId(image.id); setPreviewUrl(null); }} className={`aspect-square rounded border overflow-hidden ${selected?.id === image.id && !previewUrl ? "border-[#2D6A6A] ring-2 ring-[#2D6A6A]/20" : "border-[#E2DDD7]"}`}><img src={image.secureUrl} alt={`${product.name}, imagen ${image.position}`} className="w-full h-full object-cover" /></button>)}</div>}
    <p className="text-[10px] text-[#6B6560] text-center">{images.length}/5 imágenes</p>
    {error && <p className="text-[10px] text-[#C62828]">{error}</p>}{notice && <p className="text-[10px] text-[#2E7D32]">{notice}</p>}
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} disabled={!product.active || loading || !!removingId || images.length >= 5} />
    {selectedFile ? <div className="space-y-2"><p className="text-[10px] text-[#6B6560] truncate" title={selectedFile.name}>{selectedFile.name}</p><div className="flex gap-2"><Btn variant="secondary" size="sm" disabled={loading} onClick={clearSelection}>Cancelar</Btn><Btn variant="primary" size="sm" disabled={loading} onClick={() => void upload()}><Icon path={Icons.upload} size={13} />{loading ? "Subiendo..." : "Subir imagen"}</Btn></div></div> : <Btn variant="secondary" size="sm" disabled={!product.active || loading || !!removingId || images.length >= 5} onClick={() => inputRef.current?.click()}><Icon path={Icons.upload} size={13} />Agregar imagen</Btn>}
    {selected && !selectedFile && <Btn variant="danger" size="sm" disabled={!!removingId || loading} onClick={() => void remove()}><Icon path={Icons.x} size={13} />{removingId ? "Eliminando..." : "Eliminar imagen"}</Btn>}
    {!product.active && <p className="text-[10px] text-[#6B6560] text-center">Activa el producto para agregar imágenes.</p>}
  </div>;
}

