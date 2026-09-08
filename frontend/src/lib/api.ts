/// <reference types="vite/client" />

export type AuthRole = "ADMIN" | "INVENTORY";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
};

export type ApiCategory = {
  id: string;
  name: string;
  code: string;
  usesSizes: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiProgram = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiErrorPayload = { error?: string };

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      accept: "application/json",
      ...init.headers,
    },
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload: unknown = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const error = payload as ApiErrorPayload | undefined;
    throw new ApiError(response.status, error?.error || "Request failed.");
  }

  return payload as T;
}

export const authApi = {
  login(email: string, password: string) {
    return request<{ user: AuthenticatedUser }>("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  },

  me() {
    return request<{ user: AuthenticatedUser }>("/auth/me");
  },

  logout() {
    return request<void>("/auth/logout", { method: "POST" });
  },
};

export const categoriesApi = {
  list() {
    return request<{ categories: ApiCategory[] }>("/categories");
  },

  create(data: Pick<ApiCategory, "name" | "code" | "usesSizes">) {
    return request<{ category: ApiCategory }>("/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<Pick<ApiCategory, "name" | "code" | "usesSizes" | "active">>) {
    return request<{ category: ApiCategory }>(`/categories/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  },
};

export const programsApi = {
  list() {
    return request<{ programs: ApiProgram[] }>("/programs");
  },

  create(data: Pick<ApiProgram, "name" | "description">) {
    return request<{ program: ApiProgram }>("/programs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<Pick<ApiProgram, "name" | "description" | "active">>) {
    return request<{ program: ApiProgram }>(`/programs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
  },
};
