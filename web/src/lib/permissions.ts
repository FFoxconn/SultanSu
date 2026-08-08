// Backend'deki src/lib/permissions.ts ile birebir eşleşir. Gerçek erişim kontrolü
// backend'de requirePermission ile sağlanıyor; bu harita sadece UI'da (sidebar,
// butonlar) doğru şeyleri göstermek/gizlemek için kullanılır — güvenlik sınırı değildir.
import type { Role } from "../api/client";

export type Permission =
  | "dashboard.view"
  | "assignment.create"
  | "assignment.view"
  | "sale.view"
  | "return.view"
  | "stock.view"
  | "stock.manage"
  | "product.view"
  | "product.manage"
  | "report.view"
  | "user.view"
  | "user.manage"
  | "audit.view";

const ALL_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "assignment.create",
  "assignment.view",
  "sale.view",
  "return.view",
  "stock.view",
  "stock.manage",
  "product.view",
  "product.manage",
  "report.view",
  "user.view",
  "user.manage",
  "audit.view",
];

const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  OWNER: new Set(ALL_PERMISSIONS),
  MANAGER: new Set(ALL_PERMISSIONS.filter((p) => p !== "user.manage")),
  WAREHOUSE: new Set<Permission>([
    "dashboard.view",
    "assignment.view",
    "sale.view",
    "return.view",
    "stock.view",
    "stock.manage",
    "product.view",
    "product.manage",
    "report.view",
  ]),
  COURIER: new Set<Permission>([]),
};

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Patron",
  MANAGER: "Yönetici",
  WAREHOUSE: "Depo",
  COURIER: "Kurye",
};

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
