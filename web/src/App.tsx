import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { WaterLoader } from "./components/WaterLoader";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { Stock } from "./pages/Stock";
import { Couriers } from "./pages/Couriers";
import { CreateAssignment } from "./pages/CreateAssignment";
import { Assignments } from "./pages/Assignments";
import { AssignmentDetail } from "./pages/AssignmentDetail";
import { Reports } from "./pages/Reports";

function RequireStaff({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Web paneli Patron/Yönetici/Depo rollerine açık; Kurye rolü sadece mobil uygulamayı kullanır.
  if (!user || user.role === "COURIER") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading-screen">
        <WaterLoader size="full" label="SultanSu yükleniyor..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireStaff>
            <Layout />
          </RequireStaff>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="zimmet-olustur" element={<CreateAssignment />} />
        <Route path="zimmetler" element={<Assignments />} />
        <Route path="zimmetler/:id" element={<AssignmentDetail />} />
        <Route path="depo" element={<Stock />} />
        <Route path="urunler" element={<Products />} />
        <Route path="kuryeler" element={<Couriers />} />
        <Route path="raporlar" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
