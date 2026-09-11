import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Icons } from "./icons";

export function Modal({ title, onClose, children, width = "max-w-xl" }: {
  title: string; onClose: () => void; children: ReactNode; width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-2xl w-full ${width} mx-4 max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD7]">
          <h3 className="font-semibold text-[#1A1A1A] text-base">{title}</h3>
          <button onClick={onClose} className="text-[#6B6560] hover:text-[#1A1A1A] transition-colors"><Icon path={Icons.x} size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
