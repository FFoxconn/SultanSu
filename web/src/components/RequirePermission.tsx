import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { hasPermission, type Permission } from "../lib/permissions";
import { EmptyState } from "./EmptyState";
import { ShieldIcon } from "./icons";

/**
 * Sadece UI'da doğru mesajı göstermek için kullanılır — gerçek erişim
 * kontrolü backend'de requirePermission ile sağlanıyor (bkz. backend/src/middleware/auth.ts).
 */
export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { user } = useAuth();
  if (!hasPermission(user?.role, permission)) {
    return (
      <EmptyState
        icon={<ShieldIcon size={28} />}
        title="Bu sayfayı görüntüleme yetkiniz yok"
        description="Erişim gerekiyorsa Patron veya Yönetici ile iletişime geçin."
      />
    );
  }
  return <>{children}</>;
}
