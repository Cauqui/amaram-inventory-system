import type { ApiInventoryReport } from "../lib/api";

export function reportStatusLabel(status: ApiInventoryReport["stock"][number]["status"]) {
  return status === "AVAILABLE" ? "Disponible" : status === "LOW_STOCK" ? "Stock bajo" : "Sin stock";
}

export function reportStatusColor(status: ApiInventoryReport["stock"][number]["status"]) {
  return status === "AVAILABLE" ? "bg-[#E8F5E9] text-[#2E7D32]" : status === "LOW_STOCK" ? "bg-[#FDF3E7] text-[#C4813A]" : "bg-[#FFEBEE] text-[#C62828]";
}

export function isoDateOffset(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
