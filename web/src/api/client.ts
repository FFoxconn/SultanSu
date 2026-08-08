export type Role = "OWNER" | "MANAGER" | "WAREHOUSE" | "COURIER";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  role: Role;
};

export type AppUser = {
  id: string;
  name: string;
  phone: string;
  role: Role;
  active: boolean;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  unit: string;
  price: number;
  code: string | null;
  minStock: number;
  costPrice: number | null;
  active: boolean;
};

export type ProductDetail = Product & {
  stockItem: { id: string; quantity: number } | null;
  movements: StockMovement[];
  sales: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    createdAt: string;
    courier: { id: string; name: string };
  }>;
};

export type StockItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

export type StockStatus = "NORMAL" | "CRITICAL" | "OUT";

export function stockStatus(quantity: number, minStock: number): StockStatus {
  if (quantity <= 0) return "OUT";
  if (quantity <= minStock) return "CRITICAL";
  return "NORMAL";
}

export type StockMovement = {
  id: string;
  type: "INITIAL" | "ASSIGN" | "RETURN" | "ADJUSTMENT";
  quantity: number;
  previousQty: number;
  newQty: number;
  note: string | null;
  createdAt: string;
  product: { id: string; name: string; unit: string };
  user: { id: string; name: string } | null;
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

export type SaleRecord = {
  id: string;
  assignmentId: string;
  product: { id: string; name: string; unit: string };
  courier: { id: string; name: string };
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
};

export type ReturnRecord = {
  id: string;
  assignmentId: string;
  courier: { id: string; name: string };
  product: { id: string; name: string; unit: string };
  quantityAssigned: number;
  quantityReturned: number;
  closedAt: string;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  ip: string | null;
  createdAt: string;
  user: { id: string; name: string; role: Role } | null;
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

export type RangeReport = {
  from: string;
  to: string;
  days: Array<{ date: string; salesCount: number; quantity: number; revenue: number }>;
};

export type CourierPerformanceReport = {
  from: string;
  to: string;
  couriers: Array<{
    courier: { id: string; name: string };
    totalAssigned: number;
    totalSold: number;
    totalReturned: number;
    totalRevenue: number;
  }>;
};

export type DashboardSummary = {
  date: string;
  kpis: {
    openAssignments: number;
    activeCourierCount: number;
    stockTotalQuantity: number;
    stockProductCount: number;
    criticalStockCount: number;
    outOfStockCount: number;
    assignedToday: number;
    assignedYesterday: number;
    assignedDeltaPct: number | null;
    soldToday: number;
    soldYesterday: number;
    soldDeltaPct: number | null;
    revenueToday: number;
    revenueYesterday: number;
    revenueDeltaPct: number | null;
    returnedToday: number;
    returnedYesterday: number;
    returnedDeltaPct: number | null;
  };
  alerts: Array<{ type: string; severity: "critical" | "warning" | "info"; message: string; entityId?: string }>;
  recentActivity: Array<{
    id: string;
    action: string;
    description: string;
    user: { id: string; name: string } | null;
    createdAt: string;
  }>;
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

export class ApiError extends Error {
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
    const message = typeof body?.error === "string" ? body.error : `İstek başarısız (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

function qs(params?: Record<string, string | undefined>) {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][];
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

export const api = {
  login: (phone: string, password: string) =>
    request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    }),
  me: () => request<AuthUser>("/auth/me"),

  products: () => request<Product[]>("/products"),
  product: (id: string) => request<ProductDetail>(`/products/${id}`),
  createProduct: (data: {
    name: string;
    unit: string;
    price: number;
    initialStock: number;
    code?: string;
    minStock?: number;
    costPrice?: number;
  }) => request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Pick<Product, "name" | "unit" | "price" | "active" | "code" | "minStock" | "costPrice">>) =>
    request<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  stock: () => request<StockItem[]>("/stock"),
  stockMovements: (params?: { productId?: string }) => request<StockMovement[]>(`/stock/movements${qs(params)}`),

  couriers: () => request<Courier[]>("/couriers"),
  createCourier: (data: { name: string; phone: string; password: string }) =>
    request<Courier>("/couriers", { method: "POST", body: JSON.stringify(data) }),

  users: () => request<AppUser[]>("/users"),
  createUser: (data: { name: string; phone: string; password: string; role: Role }) =>
    request<AppUser>("/users", { method: "POST", body: JSON.stringify(data) }),

  assignments: (params?: { courierId?: string; status?: string; date?: string }) =>
    request<AssignmentView[]>(`/assignments${qs(params)}`),
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

  sales: (params?: { date?: string; from?: string; to?: string; courierId?: string; productId?: string }) =>
    request<SaleRecord[]>(`/sales${qs(params)}`),
  returns: (params?: { date?: string; from?: string; to?: string; courierId?: string; productId?: string }) =>
    request<ReturnRecord[]>(`/returns${qs(params)}`),

  auditLogs: (params?: { limit?: string }) => request<AuditLogEntry[]>(`/audit-logs${qs(params)}`),

  dailyReport: (date: string) => request<DailyReport>(`/reports/daily?date=${date}`),
  rangeReport: (params?: { from?: string; to?: string }) => request<RangeReport>(`/reports/range${qs(params)}`),
  courierPerformanceReport: (params?: { from?: string; to?: string }) =>
    request<CourierPerformanceReport>(`/reports/couriers${qs(params)}`),

  dashboardSummary: () => request<DashboardSummary>("/dashboard/summary"),
};
