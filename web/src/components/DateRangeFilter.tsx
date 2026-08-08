export function DateRangeFilter({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <div className="filter-bar">
      <div className="field">
        <label>Başlangıç</label>
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} />
      </div>
      <div className="field">
        <label>Bitiş</label>
        <input type="date" value={to} onChange={(e) => onTo(e.target.value)} />
      </div>
    </div>
  );
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function useDateRangeDefaults(defaultDays: number) {
  return { from: daysAgoStr(defaultDays - 1), to: todayStr() };
}
