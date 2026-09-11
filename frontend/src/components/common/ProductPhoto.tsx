import { Icon } from "../ui/Icon";
import { Icons } from "../ui/icons";

export function ProductPhoto({ src, alt, size = 32 }: { src?: string; alt: string; size?: number }) {
  if (!src) {
    return <div aria-label={`Sin imagen: ${alt}`} className="rounded bg-[#F5F3F0] flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}><Icon path={Icons.package} size={Math.max(13, Math.round(size * 0.48))} className="text-[#6B6560]" /></div>;
  }
  return <img src={src} alt={alt} width={size} height={size} className="rounded object-cover bg-[#F5F3F0] flex-shrink-0" style={{ width: size, height: size }} />;
}
