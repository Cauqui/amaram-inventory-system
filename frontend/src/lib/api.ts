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

export type ApiProductVariant = {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  minimumStock: number;
  active: boolean;
};

export type ApiProductImage = {
  id: string;
  publicId: string;
  secureUrl: string;
  position: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

export type ApiProduct = {
  id: string;
  skuBase: string;
  name: string;
  description: string;
  history: string | null;
  creatorName: string;
  active: boolean;
  category: Pick<ApiCategory, "id" | "name" | "code" | "usesSizes" | "active">;
  program: Pick<ApiProgram, "id" | "name" | "description" | "active">;
  variants: ApiProductVariant[];
  images: ApiProductImage[];
  createdAt: string;
  updatedAt: string;
};

export type ProductVariantInput = {
  size: string | null;
  color: string | null;
  minimumStock: number;
};

export type CreateProductInput = {
  name: string;
  description: string;
  history: string | null;
  categoryId: string;
  programId: string;
  creatorName: string;
  variants: ProductVariantInput[];
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

export const productsApi = {
  list(filters: { search?: string; categoryId?: string; programId?: string; active?: boolean } = {}) {
    const query = new URLSearchParams();
    if (filters.search) query.set("search", filters.search);
    if (filters.categoryId) query.set("categoryId", filters.categoryId);
    if (filters.programId) query.set("programId", filters.programId);
    if (filters.active !== undefined) query.set("active", String(filters.active));
    const suffix = query.size ? `?${query.toString()}` : "";
    return request<{ products: ApiProduct[] }>(`/products${suffix}`);
  },

  get(id: string) {
    return request<{ product: ApiProduct }>(`/products/${id}`);
  },

  create(data: CreateProductInput) {
    return request<{ product: ApiProduct }>("/products", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<Pick<CreateProductInput, "name" | "description" | "history" | "programId" | "creatorName">> & { active?: boolean }) {
    return request<{ product: ApiProduct }>(`/products/${id}`, {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
    });
  },

  addVariant(productId: string, data: ProductVariantInput) {
    return request<{ variant: ApiProductVariant }>(`/products/${productId}/variants`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
    });
  },

  updateVariant(productId: string, variantId: string, data: Pick<ApiProductVariant, "minimumStock" | "active">) {
    return request<{ variant: ApiProductVariant }>(`/products/${productId}/variants/${variantId}`, {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
    });
  },
};
