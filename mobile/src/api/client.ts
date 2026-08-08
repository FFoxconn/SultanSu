import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Web'de (expo start --web) tarayıcıdan doğrudan backend'e istek atılır.
// Gerçek telefonda test ederken bu adresi bilgisayarınızın yerel ağ IP'si ile değiştirin
// (ör. "http://192.168.1.20:4000/api"), localhost telefon üzerinde backend'e işaret etmez.
const API_URL =
  Platform.OS === "web" ? "http://localhost:4000/api" : "http://localhost:4000/api";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  role: "OWNER" | "COURIER";
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

const TOKEN_KEY = "sultansu_courier_token";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = typeof body?.error === "string" ? body.error : `İstek başarısız (${res.status})`;
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

  activeAssignment: () => request<AssignmentView>("/assignments/active"),
  addSale: (assignmentId: string, productId: string, quantity: number) =>
    request<AssignmentView>(`/assignments/${assignmentId}/sales`, {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),
  closeAssignment: (assignmentId: string) =>
    request<AssignmentView>(`/assignments/${assignmentId}/close`, { method: "POST" }),
};
