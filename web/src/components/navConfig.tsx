import type { ReactNode } from "react";
import type { Role } from "../api/client";
import type { Permission } from "../lib/permissions";
import {
  ClipboardIcon,
  HistoryIcon,
  HomeIcon,
  PackageIcon,
  PlusIcon,
  ReportIcon,
  RotateIcon,
  TruckIcon,
  UsersIcon,
} from "./icons";

export type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
  permission?: Permission;
  roles?: Role[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Ana Sayfa",
    items: [{ to: "/", label: "Dashboard", icon: <HomeIcon size={17} />, end: true, permission: "dashboard.view" }],
  },
  {
    title: "Operasyon",
    items: [
      { to: "/zimmet-olustur", label: "Zimmet Oluştur", icon: <PlusIcon size={17} />, permission: "assignment.create" },
      { to: "/zimmetler", label: "Zimmetler", icon: <ClipboardIcon size={17} />, permission: "assignment.view" },
      { to: "/satislar", label: "Satışlar", icon: <ReportIcon size={17} />, permission: "sale.view" },
      { to: "/iadeler", label: "İadeler", icon: <RotateIcon size={17} />, permission: "return.view" },
    ],
  },
  {
    title: "Stok & Ürün",
    items: [
      { to: "/depo", label: "Depo / Stok", icon: <PackageIcon size={17} />, permission: "stock.view" },
      { to: "/urunler", label: "Ürünler", icon: <PackageIcon size={17} />, permission: "product.view" },
      { to: "/stok-hareketleri", label: "Stok Hareketleri", icon: <HistoryIcon size={17} />, permission: "stock.view" },
    ],
  },
  {
    title: "Kurye",
    items: [{ to: "/kuryeler", label: "Kuryeler", icon: <TruckIcon size={17} />, roles: ["OWNER", "MANAGER", "WAREHOUSE"] }],
  },
  {
    title: "Raporlama",
    items: [{ to: "/raporlar", label: "Raporlar", icon: <ReportIcon size={17} />, permission: "report.view" }],
  },
  {
    title: "Yönetim",
    items: [
      { to: "/kullanicilar", label: "Kullanıcılar", icon: <UsersIcon size={17} />, permission: "user.view" },
      { to: "/islem-gecmisi", label: "İşlem Geçmişi", icon: <HistoryIcon size={17} />, permission: "audit.view" },
    ],
  },
];
