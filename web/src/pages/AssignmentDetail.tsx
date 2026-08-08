import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type AssignmentView } from "../api/client";

export function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<AssignmentView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .assignment(id)
      .then(setAssignment)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="muted">Yükleniyor...</p>;
  if (!assignment) return <p className="error-text">Zimmet bulunamadı</p>;

  return (
    <div>
      <p>
        <Link to="/zimmetler">&larr; Zimmetler</Link>
      </p>
      <h2>
        {assignment.courier.name}{" "}
        <span className={`badge ${assignment.status === "OPEN" ? "open" : "closed"}`}>
          {assignment.status === "OPEN" ? "Sahada" : "Kapandı"}
        </span>
      </h2>
      <p className="muted">
        Oluşturulma: {new Date(assignment.createdAt).toLocaleString("tr-TR")}
        {assignment.closedAt && ` · Kapanış: ${new Date(assignment.closedAt).toLocaleString("tr-TR")}`}
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ürün Bazlı Durum</h3>
        <table>
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Zimmetlenen</th>
              <th>Satılan</th>
              <th>Kalan</th>
              <th>İade</th>
            </tr>
          </thead>
          <tbody>
            {assignment.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td>{item.quantityAssigned}</td>
                <td>{item.quantitySold}</td>
                <td>{item.quantityRemaining}</td>
                <td>{item.quantityReturned ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Satışlar ({assignment.totalSalesAmount.toLocaleString("tr-TR")} ₺)</h3>
        {assignment.sales.length === 0 ? (
          <p className="empty-state">Henüz satış girilmedi.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Miktar</th>
                <th>Birim Fiyat</th>
                <th>Toplam</th>
                <th>Saat</th>
              </tr>
            </thead>
            <tbody>
              {assignment.sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.product.name}</td>
                  <td>{sale.quantity}</td>
                  <td>{sale.unitPrice.toLocaleString("tr-TR")} ₺</td>
                  <td>{sale.total.toLocaleString("tr-TR")} ₺</td>
                  <td>{new Date(sale.createdAt).toLocaleTimeString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
