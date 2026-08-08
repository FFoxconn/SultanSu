import type { ReactNode } from "react";

export function StatCard({
  icon,
  label,
  value,
  deltaPct,
  deltaLabel = "Düne göre",
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  deltaPct?: number | null;
  deltaLabel?: string;
  tone?: "neutral" | "danger" | "warning";
}) {
  const hasDelta = deltaPct !== undefined;

  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {hasDelta && (
          <div
            className={`stat-card__delta ${
              deltaPct === null ? "" : deltaPct > 0 ? "stat-card__delta--up" : deltaPct < 0 ? "stat-card__delta--down" : ""
            }`}
          >
            {deltaPct === null ? "Yeni" : `${deltaPct > 0 ? "+" : ""}${deltaPct}%`}
            <span className="stat-card__delta-label"> {deltaLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
