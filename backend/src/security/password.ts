import argon2 from "argon2";

export const passwordPolicyMessage = "La contraseña debe tener entre 12 y 128 caracteres e incluir mayúscula, minúscula, número y carácter especial.";

export function validatePassword(password: string, email: string): string | null {
  const trimmed = password.trim();
  if (trimmed.length < 12 || trimmed.length > 128) return passwordPolicyMessage;
  if (trimmed !== password && !trimmed) return passwordPolicyMessage;
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) return passwordPolicyMessage;
  if (password.toLowerCase() === email.trim().toLowerCase()) return "La contraseña no puede ser igual al correo electrónico.";
  return null;
}

export function hashPassword(password: string) { return argon2.hash(password, { type: argon2.argon2id }); }
export function verifyPassword(hash: string, password: string) { return argon2.verify(hash, password); }
