import type { ReactNode } from "react";

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="empty-state-block">
      {icon && <div className="empty-state-block__icon">{icon}</div>}
      <div className="empty-state-block__title">{title}</div>
      {description && <div className="empty-state-block__desc">{description}</div>}
    </div>
  );
}
