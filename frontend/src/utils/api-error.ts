import { ApiError } from "../lib/api";

export function apiMessage(error: unknown, fallback: string, onUnauthorized: () => void) {
  if (error instanceof ApiError && error.status === 401) {
    onUnauthorized();
    return "La sesión expiró. Inicia sesión nuevamente.";
  }
  if (error instanceof ApiError && error.status === 409) return "La variante ya existe o su SKU está en uso.";
  if (error instanceof ApiError && error.status === 404) return "El recurso solicitado ya no existe.";
  return fallback;
}
