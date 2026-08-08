export type Role = "OWNER" | "COURIER";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  role: Role;
};

export type Product = {
  id: string;
  name: string;
  unit: string;
  price: number;
  active: boolean;
};

export type StockItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

export type Courier = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  createdAt: string;
};

export type AssignmentItemView = {
  id: string;
  product: { id: string; name: string; unit: string };
  quantityAssigned: number;
  quantitySold: number;
  quantityRemaining: number;
  quantityReturned: number | null;
};

export type SaleView = {
  id: string;
  product: { id: string; name: string };
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
};

export type AssignmentView = {
  id: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  closedAt: string | null;
  courier: { id: string; name: string; phone: string };
  items: AssignmentItemView[];
  sales: SaleView[];
  totalSalesAmount: number;
};

export type DailyReport = {
  date: string;
  couriers: Array<{
    assignmentId: string;
    courier: { id: string; name: string; phone: string };
    status: "OPEN" | "CLOSED";
    items: Array<{
      product: { id: string; name: string };
      assigned: number;
      sold: number;
      returned: number | null;
    }>;
    totalAssigned: number;
    totalSold: number;
    totalReturned: number;
    totalRevenue: number;
  }>;
  summary: {
    totalAssigned: number;
    totalSold: number;
    totalReturned: number;
    totalRevenue: number;
  };
};

const TOKEN_KEY = "sultansu_token";

// "Beni Hatırla" işaretliyse token localStorage'da (tarayıcı kapansa da kalıcı),
// işaretli değilse sessionStorage'da (sekme kapanınca silinir) tutulur.
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null, remember: boolean = true) {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  if (token) {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  }
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = body?.error ? JSON.stringify(body.error) : `İstek başarısız (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

export const api = {
  login: (phone: string, password: string) =>
    request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    }),
  me: () => request<AuthUser>("/auth/me"),

  products: () => request<Product[]>("/products"),
  createProduct: (data: { name: string; unit: string; price: number; initialStock: number }) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),

  stock: () => request<StockItem[]>("/stock"),

  couriers: () => request<Courier[]>("/couriers"),
  createCourier: (data: { name: string; phone: string; password: string }) =>
    request<Courier>("/couriers", { method: "POST", body: JSON.stringify(data) }),

  assignments: (params?: { courierId?: string; status?: string; date?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<AssignmentView[]>(`/assignments${qs ? `?${qs}` : ""}`);
  },
  assignment: (id: string) => request<AssignmentView>(`/assignments/${id}`),
  createAssignment: (data: { courierId: string; items: Array<{ productId: string; quantity: number }> }) =>
    request<AssignmentView>("/assignments", { method: "POST", body: JSON.stringify(data) }),

  activeAssignment: () => request<AssignmentView>("/assignments/active"),
  addSale: (assignmentId: string, data: { productId: string; quantity: number }) =>
    request<AssignmentView>(`/assignments/${assignmentId}/sales`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  closeAssignment: (assignmentId: string) =>
    request<AssignmentView>(`/assignments/${assignmentId}/close`, { method: "POST" }),

  dailyReport: (date: string) => request<DailyReport>(`/reports/daily?date=${date}`),
};

export { ApiError };
