import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AssignmentView } from "../api/client";

export function Assignments() {
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .assignments()
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Zimmetler</h2>
      <div className="card">
        {loading ? (
          <p className="muted">Yükleniyor...</p>
        ) : assignments.length === 0 ? (
          <p className="empty-state">Henüz zimmet oluşturulmadı.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Kurye</th>
                <th>Durum</th>
                <th>Oluşturulma</th>
                <th>Ürün Sayısı</th>
                <th>Ciro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>{a.courier.name}</td>
                  <td>
                    <span className={`badge ${a.status === "OPEN" ? "open" : "closed"}`}>
                      {a.status === "OPEN" ? "Sahada" : "Kapandı"}
                    </span>
                  </td>
                  <td>{new Date(a.createdAt).toLocaleString("tr-TR")}</td>
                  <td>{a.items.length}</td>
                  <td>{a.totalSalesAmount.toLocaleString("tr-TR")} ₺</td>
                  <td>
                    <Link to={`/zimmetler/${a.id}`}>Detay</Link>
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
