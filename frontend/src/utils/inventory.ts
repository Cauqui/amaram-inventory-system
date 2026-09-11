import type { ApiProduct, ApiProductVariant } from "../lib/api";

export type StockVisualStatus = "available" | "low_stock" | "out_of_stock" | "inactive";
export type ProductVisualStatus = StockVisualStatus;

export function getStatusLabel(status: StockVisualStatus) {
  return { available: "Disponible", low_stock: "Stock bajo", out_of_stock: "Sin stock", inactive: "Inactivo" }[status];
}

export function getStatusColor(status: StockVisualStatus) {
  return {
    available: "bg-[#E8F5E9] text-[#2E7D32]",
    low_stock: "bg-[#FDF3E7] text-[#C4813A]",
    out_of_stock: "bg-[#FFEBEE] text-[#C62828]",
    inactive: "bg-gray-100 text-gray-500",
  }[status];
}

export function variantVisualStatus(variant: ApiProductVariant): ProductVisualStatus {
  if (!variant.active) return "inactive";
  if (variant.stock === 0) return "out_of_stock";
  if (variant.stock <= variant.minimumStock) return "low_stock";
  return "available";
}

export function productVisualStatus(product: ApiProduct): ProductVisualStatus {
  if (!product.active) return "inactive";
  const statuses = product.variants.filter((variant) => variant.active).map(variantVisualStatus);
  if (!statuses.length || statuses.every((status) => status === "out_of_stock")) return "out_of_stock";
  if (statuses.some((status) => status === "low_stock" || status === "out_of_stock")) return "low_stock";
  return "available";
}
