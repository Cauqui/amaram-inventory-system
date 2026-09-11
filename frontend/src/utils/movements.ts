import type { ApiInventoryMovement, InventoryMovementType } from "../lib/api";

export function movementTypeLabel(type: InventoryMovementType) {
  return type === "ENTRY" ? "Entrada" : type === "EXIT" ? "Salida" : "Ajuste";
}

export function movementTypeColor(type: InventoryMovementType) {
  return type === "ENTRY" ? "bg-[#E8F5E9] text-[#2E7D32]" : type === "EXIT" ? "bg-[#FFEBEE] text-[#C62828]" : "bg-[#E3F2FD] text-[#1565C0]";
}

export function movementQuantity(movement: ApiInventoryMovement) {
  const value = movement.type === "EXIT" ? -movement.quantity : movement.quantity;
  return `${value > 0 ? "+" : ""}${value}`;
}

export function movementQuantityColor(movement: ApiInventoryMovement) {
  return movement.type === "ENTRY" || movement.quantity > 0 && movement.type === "ADJUSTMENT" ? "text-[#2E7D32]" : "text-[#C62828]";
}
