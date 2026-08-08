import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { Stock } from "./pages/Stock";
import { Couriers } from "./pages/Couriers";
import { CreateAssignment } from "./pages/CreateAssignment";
import { Assignments } from "./pages/Assignments";
import { AssignmentDetail } from "./pages/AssignmentDetail";
import { Reports } from "./pages/Reports";

function RequireOwner({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 24 }}>Yükleniyor...</p>;
  if (!user || user.role !== "OWNER") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireOwner>
            <Layout />
          </RequireOwner>
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
