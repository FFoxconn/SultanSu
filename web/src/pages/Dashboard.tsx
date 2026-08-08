import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type DailyReport } from "../api/client";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function Dashboard() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .dailyReport(todayStr())
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Yükleniyor...</p>;
  if (!report) return <p className="error-text">Rapor yüklenemedi</p>;

  const openCount = report.couriers.filter((c) => c.status === "OPEN").length;

  return (
    <div>
      <h2>Bugün ({report.date})</h2>

      <div className="stat-row">
        <div className="stat">
          <div className="label">Açık Zimmet</div>
          <div className="value">{openCount}</div>
        </div>
        <div className="stat">
          <div className="label">Zimmetlenen Ürün</div>
          <div className="value">{report.summary.totalAssigned}</div>
        </div>
        <div className="stat">
          <div className="label">Satılan Ürün</div>
          <div className="value">{report.summary.totalSold}</div>
        </div>
        <div className="stat">
          <div className="label">Bugünkü Ciro</div>
          <div className="value">{report.summary.totalRevenue.toLocaleString("tr-TR")} ₺</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Kuryeler</h3>
        {report.couriers.length === 0 ? (
          <p className="empty-state">Bugün henüz bir zimmet oluşturulmadı.</p>
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
                  <td>{c.status === "OPEN" ? "-" : c.totalReturned}</td>
                  <td>{c.totalRevenue.toLocaleString("tr-TR")} ₺</td>
                  <td>
                    <Link to={`/zimmetler/${c.assignmentId}`}>Detay</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
