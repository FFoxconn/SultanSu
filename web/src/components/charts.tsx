import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RangeReport, CourierPerformanceReport } from "../api/client";

const COLORS = {
  primary: "#1d6fd6",
  accent: "#4fc3f7",
  success: "#1f9254",
  warning: "#b5730c",
  danger: "#d63b3b",
  muted: "#6b7683",
};

function formatDay(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

export function SalesTrendChart({ days }: { days: RangeReport["days"] }) {
  const data = days.map((d) => ({ ...d, label: formatDay(d.date) }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.28} />
            <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: COLORS.muted }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: COLORS.muted }} axisLine={false} tickLine={false} width={56} />
        <Tooltip
          formatter={(value, name) => [
            name === "revenue" ? `${Number(value).toLocaleString("tr-TR")} ₺` : String(value),
            name === "revenue" ? "Ciro" : name === "quantity" ? "Satılan Adet" : "Satış Sayısı",
          ]}
          labelFormatter={(label) => `Tarih: ${label}`}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 12.5 }}
        />
        <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2} fill="url(#revenueGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AssignmentStatusDonut({ open, closed }: { open: number; closed: number }) {
  const data = [
    { name: "Açık (Sahada)", value: open, color: COLORS.warning },
    { name: "Kapandı", value: closed, color: COLORS.success },
  ];
  const total = open + closed;
  if (total === 0) {
    return <ChartEmpty text="Bugün için zimmet verisi yok." />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 12.5 }} />
        <Legend verticalAlign="bottom" height={28} iconType="circle" wrapperStyle={{ fontSize: 12.5 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function StockStatusBar({ normal, critical, out }: { normal: number; critical: number; out: number }) {
  const data = [
    { name: "Normal", value: normal, color: COLORS.success },
    { name: "Kritik", value: critical, color: COLORS.warning },
    { name: "Tükendi", value: out, color: COLORS.danger },
  ];
  if (normal + critical + out === 0) {
    return <ChartEmpty text="Ürün kaydı yok." />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12.5, fill: COLORS.muted }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: COLORS.muted }} axisLine={false} tickLine={false} width={32} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 12.5 }} formatter={(v) => [String(v), "Ürün"]} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CourierPerformanceBarChart({ couriers }: { couriers: CourierPerformanceReport["couriers"] }) {
  if (couriers.length === 0) {
    return <ChartEmpty text="Seçilen aralıkta zimmet/satış verisi yok." />;
  }
  const data = couriers.slice(0, 8).map((c) => ({ name: c.courier.name, Ciro: Math.round(c.totalRevenue), Satış: c.totalSold }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11.5, fill: COLORS.muted }} axisLine={false} tickLine={false} interval={0} angle={-14} textAnchor="end" height={46} />
        <YAxis tick={{ fontSize: 12, fill: COLORS.muted }} axisLine={false} tickLine={false} width={56} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 12.5 }} />
        <Legend wrapperStyle={{ fontSize: 12.5 }} />
        <Bar dataKey="Ciro" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
        <Bar dataKey="Satış" fill={COLORS.accent} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartEmpty({ text }: { text: string }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
      {text}
    </div>
  );
}
