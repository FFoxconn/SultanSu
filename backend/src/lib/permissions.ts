import type { Role } from "./roles";

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

export const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
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
  // Kurye rolü web paneline değil, mobil uygulamaya özel uçlara sahip
  // (/api/assignments/active, /sales, /close) — bu izin haritası onları etkilemez.
  COURIER: new Set<Permission>([]),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
