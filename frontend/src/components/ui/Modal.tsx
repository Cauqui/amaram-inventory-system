import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Icons } from "./icons";

export function Modal({ title, onClose, children, width = "max-w-xl" }: {
  title: string; onClose: () => void; children: ReactNode; width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-lg shadow-2xl w-full ${width} max-h-[calc(100dvh-2rem)] overflow-y-auto`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E2DDD7]">
          <h3 className="font-semibold text-[#1A1A1A] text-base">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar modal" className="text-[#6B6560] hover:text-[#1A1A1A] transition-colors"><Icon path={Icons.x} size={18} /></button>
        </div>
        <div className="px-4 sm:px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
