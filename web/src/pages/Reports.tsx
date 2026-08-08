import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type DailyReport } from "../api/client";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function Reports() {
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
      <h2>Raporlar</h2>

      <div className="card">
        <label>Tarih</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 200 }} />
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

          <div className="card">
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
          </div>
        </>
      )}
    </div>
  );
}
