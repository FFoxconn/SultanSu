import type { ReactNode } from "react";

export function ChartCard({
  title,
  actions,
  children,
  height = 280,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  height?: number;
}) {
  return (
    <div className="card chart-card">
      <div className="card__header">
        <h3 className="card__title">{title}</h3>
        {actions && <div className="card__actions">{actions}</div>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
