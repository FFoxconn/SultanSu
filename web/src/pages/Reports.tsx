import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  stockStatus,
  type AssignmentView,
  type CourierPerformanceReport,
  type DailyReport,
  type RangeReport,
  type SaleRecord,
  type StockItem,
} from "../api/client";
import { Card } from "../components/Card";
import { ChartCard } from "../components/ChartCard";
import { DataTable, type Column } from "../components/DataTable";
import { SalesTrendChart, StockStatusBar, CourierPerformanceBarChart } from "../components/charts";
import { Badge } from "../components/Badge";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const TABS = ["Genel", "Satış", "Stok", "Zimmet", "Performans"] as const;
type Tab = (typeof TABS)[number];

export function Reports() {
  const [tab, setTab] = useState<Tab>("Genel");

  return (
    <div>
      <h2>Raporlar</h2>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Genel" && <GeneralTab />}
      {tab === "Satış" && <SalesTab />}
      {tab === "Stok" && <StockTab />}
      {tab === "Zimmet" && <AssignmentTab />}
      {tab === "Performans" && <PerformanceTab />}
    </div>
  );
}

function GeneralTab() {
  const [date, setDate] = useState(todayStr());
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .dailyReport(date)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div>
      <div className="filter-bar">
        <div className="field">
          <label>Tarih</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="muted">Yükleniyor...</p>
      ) : !report ? (
        <p className="error-text">Rapor yüklenemedi</p>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat">
              <div className="label">Zimmetlenen</div>
              <div className="value">{report.summary.totalAssigned}</div>
            </div>
            <div className="stat">
              <div className="label">Satılan</div>
              <div className="value">{report.summary.totalSold}</div>
            </div>
            <div className="stat">
              <div className="label">İade</div>
              <div className="value">{report.summary.totalReturned}</div>
            </div>
            <div className="stat">
              <div className="label">Ciro</div>
              <div className="value">{report.summary.totalRevenue.toLocaleString("tr-TR")} ₺</div>
            </div>
          </div>

          <Card>
            {report.couriers.length === 0 ? (
              <p className="empty-state">Bu tarihte kayıt yok.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Kurye</th>
                    <th>Durum</th>
                    <th>Zimmet</th>
                    <th>Satış</th>
                    <th>İade</th>
                    <th>Ciro</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {report.couriers.map((c) => (
                    <tr key={c.assignmentId}>
                      <td>{c.courier.name}</td>
                      <td>
                        <span className={`badge ${c.status === "OPEN" ? "open" : "closed"}`}>
                          {c.status === "OPEN" ? "Sahada" : "Kapandı"}
                        </span>
                      </td>
                      <td>{c.totalAssigned}</td>
                      <td>{c.totalSold}</td>
                      <td>{c.totalReturned}</td>
                      <td>{c.totalRevenue.toLocaleString("tr-TR")} ₺</td>
                      <td>
                        <Link to={`/zimmetler/${c.assignmentId}`}>Detay</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function useDateRange(defaultDays: number) {
  const [from, setFrom] = useState(daysAgoStr(defaultDays - 1));
  const [to, setTo] = useState(todayStr());
  return { from, setFrom, to, setTo };
}

function SalesTab() {
  const { from, setFrom, to, setTo } = useDateRange(7);
  const [range, setRange] = useState<RangeReport | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.rangeReport({ from, to }), api.sales()])
      .then(([r, s]) => {
        setRange(r);
        setSales(s.filter((sale) => sale.createdAt.slice(0, 10) >= from && sale.createdAt.slice(0, 10) <= to));
      })
      .finally(() => setLoading(false));
  }, [from, to]);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

  const columns: Column<SaleRecord>[] = [
    { key: "createdAt", header: "Tarih", render: (s) => new Date(s.createdAt).toLocaleString("tr-TR"), csvValue: (s) => new Date(s.createdAt).toLocaleString("tr-TR"), sortValue: (s) => new Date(s.createdAt).getTime() },
    { key: "courier", header: "Kurye", render: (s) => s.courier.name, csvValue: (s) => s.courier.name },
    { key: "product", header: "Ürün", render: (s) => s.product.name, csvValue: (s) => s.product.name },
    { key: "quantity", header: "Miktar", render: (s) => s.quantity, csvValue: (s) => s.quantity, align: "right" },
    { key: "total", header: "Toplam", render: (s) => `${s.total.toLocaleString("tr-TR")} ₺`, csvValue: (s) => s.total, sortValue: (s) => s.total, align: "right" },
  ];

  return (
    <div>
      <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />
      <div className="stat-row">
        <div className="stat">
          <div className="label">Satış Sayısı</div>
          <div className="value">{sales.length}</div>
        </div>
        <div className="stat">
          <div className="label">Toplam Ciro</div>
          <div className="value">{totalRevenue.toLocaleString("tr-TR")} ₺</div>
        </div>
      </div>
      <ChartCard title="Günlük Satış & Ciro">{range && <SalesTrendChart days={range.days} />}</ChartCard>
      <Card>
        <DataTable columns={columns} data={sales} rowKey={(s) => s.id} loading={loading} exportFilename="satis-raporu" emptyMessage="Bu aralıkta satış yok." />
      </Card>
    </div>
  );
}

function StockTab() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .stock()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const normal = items.filter((i) => stockStatus(i.quantity, i.product.minStock) === "NORMAL").length;
  const critical = items.filter((i) => stockStatus(i.quantity, i.product.minStock) === "CRITICAL").length;
  const out = items.filter((i) => stockStatus(i.quantity, i.product.minStock) === "OUT").length;
  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.product.price, 0);

  const columns: Column<StockItem>[] = [
    { key: "name", header: "Ürün", render: (i) => i.product.name, csvValue: (i) => i.product.name, sortValue: (i) => i.product.name },
    { key: "quantity", header: "Stok", render: (i) => i.quantity, csvValue: (i) => i.quantity, sortValue: (i) => i.quantity, align: "right" },
    { key: "value", header: "Stok Değeri", render: (i) => `${(i.quantity * i.product.price).toLocaleString("tr-TR")} ₺`, csvValue: (i) => i.quantity * i.product.price, align: "right" },
    {
      key: "status",
      header: "Durum",
      render: (i) => {
        const s = stockStatus(i.quantity, i.product.minStock);
        return s === "NORMAL" ? <Badge variant="success">Normal</Badge> : s === "CRITICAL" ? <Badge variant="warning">Kritik</Badge> : <Badge variant="danger">Tükendi</Badge>;
      },
    },
  ];

  return (
    <div>
      <div className="stat-row">
        <div className="stat">
          <div className="label">Toplam Ürün</div>
          <div className="value">{items.length}</div>
        </div>
        <div className="stat">
          <div className="label">Stok Değeri</div>
          <div className="value">{totalValue.toLocaleString("tr-TR")} ₺</div>
        </div>
      </div>
      <ChartCard title="Stok Durumu Dağılımı" height={260}>
        <StockStatusBar normal={normal} critical={critical} out={out} />
      </ChartCard>
      <Card>
        <DataTable columns={columns} data={items} rowKey={(i) => i.id} loading={loading} exportFilename="stok-raporu" emptyMessage="Ürün yok." />
      </Card>
    </div>
  );
}

function AssignmentTab() {
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .assignments()
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, []);

  const open = assignments.filter((a) => a.status === "OPEN");
  const closed = assignments.filter((a) => a.status === "CLOSED");
  const openValue = open.reduce((sum, a) => sum + a.totalSalesAmount, 0);
  const closedValue = closed.reduce((sum, a) => sum + a.totalSalesAmount, 0);

  return (
    <div>
      <div className="stat-row">
        <div className="stat">
          <div className="label">Açık Zimmetler</div>
          <div className="value">{open.length}</div>
        </div>
        <div className="stat">
          <div className="label">Tamamlanan Zimmetler</div>
          <div className="value">{closed.length}</div>
        </div>
        <div className="stat">
          <div className="label">Açık Zimmet Ciro</div>
          <div className="value">{openValue.toLocaleString("tr-TR")} ₺</div>
        </div>
        <div className="stat">
          <div className="label">Tamamlanan Ciro</div>
          <div className="value">{closedValue.toLocaleString("tr-TR")} ₺</div>
        </div>
      </div>
      <Card>
        {loading ? (
          <p className="muted">Yükleniyor...</p>
        ) : (
          <p className="empty-state" style={{ padding: "8px 0" }}>
            Kurye zimmetlerinin tam listesi ve filtrelenebilir tablo için{" "}
            <Link to="/zimmetler">Zimmetler sayfasına</Link> bakın.
          </p>
        )}
      </Card>
    </div>
  );
}

function PerformanceTab() {
  const { from, setFrom, to, setTo } = useDateRange(30);
  const [perf, setPerf] = useState<CourierPerformanceReport | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.courierPerformanceReport({ from, to }), api.sales()])
      .then(([p, s]) => {
        setPerf(p);
        setSales(s.filter((sale) => sale.createdAt.slice(0, 10) >= from && sale.createdAt.slice(0, 10) <= to));
      })
      .finally(() => setLoading(false));
  }, [from, to]);

  const productRanking = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const s of sales) {
      const entry = map.get(s.product.id) ?? { name: s.product.name, quantity: 0, revenue: 0 };
      entry.quantity += s.quantity;
      entry.revenue += s.total;
      map.set(s.product.id, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  return (
    <div>
      <DateRangeFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />

      <ChartCard title="Kurye Performansı (Ciro & Satış)">
        {perf && <CourierPerformanceBarChart couriers={perf.couriers} />}
      </ChartCard>

      <div className="dashboard-grid">
        <Card title="Ciro Sıralaması / İade Oranı">
          {loading ? (
            <p className="muted">Yükleniyor...</p>
          ) : !perf || perf.couriers.length === 0 ? (
            <p className="empty-state">Bu aralıkta veri yok.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Kurye</th>
                  <th>Ciro</th>
                  <th>İade Oranı</th>
                </tr>
              </thead>
              <tbody>
                {perf.couriers.map((c) => (
                  <tr key={c.courier.id}>
                    <td>{c.courier.name}</td>
                    <td>{c.totalRevenue.toLocaleString("tr-TR")} ₺</td>
                    <td>{c.totalAssigned > 0 ? `%${Math.round((c.totalReturned / c.totalAssigned) * 100)}` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="En Çok Satan Ürünler">
          {productRanking.length === 0 ? (
            <p className="empty-state">Bu aralıkta satış yok.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Adet</th>
                  <th>Ciro</th>
                </tr>
              </thead>
              <tbody>
                {productRanking.slice(0, 10).map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{p.quantity}</td>
                    <td>{p.revenue.toLocaleString("tr-TR")} ₺</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

function DateRangeFilter({
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
