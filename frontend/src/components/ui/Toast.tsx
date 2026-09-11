import { Icon } from "./Icon";
import { Icons } from "./icons";

export function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-2 ${type === "success" ? "bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]" : "bg-[#FFEBEE] border-[#C62828] text-[#C62828]"}`}>
      <Icon path={type === "success" ? Icons.check : Icons.alert} size={16} />
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><Icon path={Icons.x} size={14} /></button>
    </div>
  );
}
