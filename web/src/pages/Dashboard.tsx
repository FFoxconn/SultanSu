import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, stockStatus, type AssignmentView, type DashboardSummary, type RangeReport, type CourierPerformanceReport, type StockItem } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { StatCard } from "../components/StatCard";
import { ChartCard } from "../components/ChartCard";
import { Card } from "../components/Card";
import { SkeletonCard } from "../components/Skeleton";
import { AssignmentStatusDonut, CourierPerformanceBarChart, SalesTrendChart, StockStatusBar } from "../components/charts";
import {
  AlertTriangleIcon,
  ClipboardIcon,
  PackageIcon,
  PlusIcon,
  RefreshIcon,
  ReportIcon,
  RotateIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from "../components/icons";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [range, setRange] = useState<RangeReport | null>(null);
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [courierPerf, setCourierPerf] = useState<CourierPerformanceReport | null>(null);
  const [todayAssignments, setTodayAssignments] = useState<AssignmentView[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadAll() {
    const from = new Date();
    from.setDate(from.getDate() - (rangeDays - 1));
    const fromStr = from.toISOString().slice(0, 10);

    const [summaryRes, rangeRes, courierRes, assignmentsRes, stockRes] = await Promise.all([
      api.dashboardSummary(),
      api.rangeReport({ from: fromStr, to: todayStr() }),
      api.courierPerformanceReport({ from: fromStr, to: todayStr() }),
      api.assignments({ date: todayStr() }),
      api.stock(),
    ]);
    setSummary(summaryRes);
    setRange(rangeRes);
    setCourierPerf(courierRes);
    setTodayAssignments(assignmentsRes);
    setStock(stockRes);
  }

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <div>
        <h2>Yükleniyor...</h2>
        <div className="stat-row">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={1} />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return <p className="error-text">Panel verileri yüklenemedi.</p>;

  const { kpis } = summary;
  const openToday = todayAssignments.filter((a) => a.status === "OPEN").length;
  const closedToday = todayAssignments.filter((a) => a.status === "CLOSED").length;
  const stockNormal = stock.filter((s) => stockStatus(s.quantity, s.product.minStock) === "NORMAL").length;
  const stockCritical = stock.filter((s) => stockStatus(s.quantity, s.product.minStock) === "CRITICAL").length;
  const stockOut = stock.filter((s) => stockStatus(s.quantity, s.product.minStock) === "OUT").length;

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 style={{ marginBottom: 2 }}>Hoş geldiniz, {user?.name}</h2>
          <p className="muted" style={{ margin: 0 }}>
            Bugün, {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="secondary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon size={15} /> Yenile
          </button>
          <Link to="/raporlar">
            <button type="button">
              <ReportIcon size={15} /> Rapor Al
            </button>
          </Link>
        </div>
      </div>

      <div className="stat-row" style={{ marginTop: 18 }}>
        <StatCard icon={<ClipboardIcon size={19} />} label="Açık Zimmet" value={kpis.openAssignments} />
        <StatCard
          icon={<PackageIcon size={19} />}
          label="Zimmetlenen Ürün (Bugün)"
          value={kpis.assignedToday}
          deltaPct={kpis.assignedDeltaPct}
        />
        <StatCard icon={<TruckIcon size={19} />} label="Bugünkü Satış" value={kpis.soldToday} deltaPct={kpis.soldDeltaPct} />
        <StatCard
          icon={<WalletIcon size={19} />}
          label="Bugünkü Ciro"
          value={`${kpis.revenueToday.toLocaleString("tr-TR")} ₺`}
          deltaPct={kpis.revenueDeltaPct}
        />
      </div>

      <div className="stat-row">
        <StatCard icon={<RotateIcon size={19} />} label="Bugünkü İade" value={kpis.returnedToday} deltaPct={kpis.returnedDeltaPct} />
        <StatCard icon={<PackageIcon size={19} />} label="Depo Stoku" value={kpis.stockTotalQuantity} />
        <StatCard
          icon={<AlertTriangleIcon size={19} />}
          label="Kritik Stok"
          value={kpis.criticalStockCount + kpis.outOfStockCount}
          tone={kpis.criticalStockCount + kpis.outOfStockCount > 0 ? "warning" : "neutral"}
        />
        <StatCard icon={<TruckIcon size={19} />} label="Aktif Kurye" value={kpis.activeCourierCount} />
      </div>

      <ChartCard
        title="Satış & Ciro"
        actions={
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className={rangeDays === 7 ? "" : "secondary"} onClick={() => setRangeDays(7)}>
              7 gün
            </button>
            <button type="button" className={rangeDays === 30 ? "" : "secondary"} onClick={() => setRangeDays(30)}>
              30 gün
            </button>
          </div>
        }
      >
        {range && <SalesTrendChart days={range.days} />}
      </ChartCard>

      <div className="dashboard-grid">
        <ChartCard title="Zimmet Durumu (Bugün)" height={260}>
          <AssignmentStatusDonut open={openToday} closed={closedToday} />
        </ChartCard>
        <ChartCard title="Stok Durumu" height={260}>
          <StockStatusBar normal={stockNormal} critical={stockCritical} out={stockOut} />
        </ChartCard>
      </div>

      <ChartCard title={`Kurye Performansı (Son ${rangeDays} gün)`} height={300}>
        {courierPerf && <CourierPerformanceBarChart couriers={courierPerf.couriers} />}
      </ChartCard>

      <div className="dashboard-grid">
        <Card title="Kritik Uyarılar">
          {summary.alerts.length === 0 ? (
            <p className="empty-state">Şu anda bir uyarı yok.</p>
          ) : (
            <div className="alert-list">
              {summary.alerts.map((alert, i) => (
                <div key={i} className={`alert-item ${alert.severity === "critical" ? "alert-item--critical" : alert.severity === "warning" ? "alert-item--warning" : ""}`}>
                  <AlertTriangleIcon size={15} />
                  {alert.message}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Son İşlemler">
          {summary.recentActivity.length === 0 ? (
            <p className="empty-state">Henüz işlem kaydı yok.</p>
          ) : (
            <div className="timeline">
              {summary.recentActivity.map((entry) => (
                <div className="timeline-item" key={entry.id}>
                  <div className="timeline-item__time">
                    {new Date(entry.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div>
                    <div className="timeline-item__body">{entry.description}</div>
                    {entry.user && <div className="timeline-item__meta">{entry.user.name}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Hızlı İşlemler">
        <div className="quick-actions">
          <Link className="quick-action" to="/zimmet-olustur">
            <span className="quick-action__icon">
              <PlusIcon size={17} />
            </span>
            Zimmet Oluştur
          </Link>
          <Link className="quick-action" to="/urunler">
            <span className="quick-action__icon">
              <PackageIcon size={17} />
            </span>
            Ürün Ekle
          </Link>
          <Link className="quick-action" to="/kuryeler">
            <span className="quick-action__icon">
              <UsersIcon size={17} />
            </span>
            Kurye Ekle
          </Link>
          <Link className="quick-action" to="/raporlar">
            <span className="quick-action__icon">
              <ReportIcon size={17} />
            </span>
            Rapor Görüntüle
          </Link>
        </div>
      </Card>
    </div>
  );
}
