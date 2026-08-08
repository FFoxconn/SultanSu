export type Role = "OWNER" | "MANAGER" | "WAREHOUSE" | "COURIER";

export const ROLES: Role[] = ["OWNER", "MANAGER", "WAREHOUSE", "COURIER"];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Patron",
  MANAGER: "Yönetici",
  WAREHOUSE: "Depo",
  COURIER: "Kurye",
};

export function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value);
}
