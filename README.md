# SultanSu — Bayi Yönetim ve Dağıtım Operasyon Sistemi

Su bayileri için uçtan uca operasyon paneli: Patron/Yönetici kuryeye ürün zimmetler,
kurye mobil uygulamadan satış girer, gün sonunda satılmayan ürünler otomatik olarak
depo stoğuna **iade** edilir. Web paneli; KPI'lı bir dashboard, stok/ürün/kurye
yönetimi, satış/iade/stok hareketi kayıtları, rol bazlı yetkilendirme ve işlem
geçmişi (audit log) içeren kurumsal bir ERP/SaaS deneyimi sunar.

## Proje yapısı

```
backend/   Express + TypeScript + Prisma (SQLite, dev) — REST API + RBAC + audit log
web/       React + Vite — Patron/Yönetici/Depo yönetim paneli (recharts, DataTable, vb.)
mobile/    Expo (React Native) — Kurye mobil uygulaması
```

## Kurulum

Her paket kendi `node_modules`'una sahiptir (npm workspaces).

```bash
cd backend && npm install
cd ../web && npm install
cd ../mobile && npm install
```

### Backend

```bash
cd backend
cp .env.example .env        # DATABASE_URL, JWT_SECRET, PORT
npx prisma migrate dev      # veritabanı şemasını oluşturur (SQLite: prisma/dev.db)
npm run seed                # demo kullanıcılar + ürünler
npm run dev                 # http://localhost:4000
```

Demo hesaplar (seed sonrası):

| Rol      | Telefon    | Şifre        |
|----------|-----------|--------------|
| Patron (OWNER)     | 5550000001 | patron123   |
| Yönetici (MANAGER) | 5550000003 | yonetici123 |
| Depo (WAREHOUSE)   | 5550000004 | depo123     |
| Kurye (COURIER)    | 5550000002 | kurye123    |

Roller ve yetkiler `backend/src/lib/permissions.ts` içinde tanımlıdır ve her
endpoint'te backend tarafında gerçekten uygulanır (frontend sadece menü/UI
görünürlüğü için aynı haritayı kullanır — `web/src/lib/permissions.ts`).

Testler (ayrı `prisma/test.db` üzerinde çalışır, `npm test` çalıştırınca otomatik
şema push edilir):

```bash
npm test
```

### Web paneli

```bash
cd web
npm run dev   # http://localhost:5173 — backend'e /api üzerinden proxy yapar
```

### Mobil uygulama (Kurye)

```bash
cd mobile
npx expo start --web   # tarayıcıda test (bu ortamda native simülatör yok)
# Telefonda gerçek testte: src/api/client.ts içindeki API_URL'i
# bilgisayarınızın yerel ağ IP'sine göre güncelleyin (localhost telefonu göstermez).
```

## İş akışı

1. **Patron/Yönetici (web)** → *Zimmet Oluştur*: kurye + ürün/miktar seçer. Depo
   stoğundan otomatik düşülür, bir `StockMovement` (ASSIGN) kaydı oluşur.
2. **Kurye (mobil)** → *Bugünkü Zimmetim* ekranında zimmetini görür, gün içinde her
   satışta *Satış Ekle* ile ürün+miktar girer.
3. Akşam kurye *Günü Kapat* der → satılmayan miktar otomatik olarak depo stoğuna
   **iade** edilir (`StockMovement` RETURN), zimmet `CLOSED` durumuna geçer.
4. **Web paneli** → Dashboard, Zimmetler, Satışlar, İadeler, Depo/Stok, Stok
   Hareketleri, Kuryeler, Raporlar (Genel/Satış/Stok/Zimmet/Performans),
   Kullanıcılar ve İşlem Geçmişi sayfalarında hepsi gerçek backend verisinden
   anlık olarak görünür.

## Web paneli modülleri

- **Dashboard** — 8 KPI kartı (gerçek dünle-kıyas yüzdesiyle), satış&ciro trend
  grafiği, zimmet durumu / stok durumu / kurye performansı grafikleri (recharts),
  kritik uyarılar ve son işlemler (audit log'dan), hızlı işlemler.
- **Operasyon** — Zimmet Oluştur, Zimmetler, Satışlar, İadeler.
- **Stok & Ürün** — Depo/Stok (kritik stok vurgusu), Ürünler (kod/alış-satış
  fiyatı/kritik eşik), Ürün Detay (stok hareketi + satış geçmişi), Stok
  Hareketleri.
- **Kurye** — Kuryeler (performans özetli detay paneli).
- **Raporlama** — Genel/Satış/Stok/Zimmet/Performans sekmeleri, CSV export.
- **Yönetim** — Kullanıcılar (rol atayarak oluşturma), İşlem Geçmişi (audit log,
  IP dahil).

Tüm liste ekranları arama, sıralama, sayfalama ve CSV export destekler
(`web/src/components/DataTable.tsx`).

## Kapsam dışı (bilinçli tasarım kararları)

- **PDF/Excel export yok** — CSV export var (Excel'de açılabilir); yanıltıcı bir
  "PDF" butonu eklenmedi.
- **Bildirim merkezi kalıcı değil** — Topbar'daki uyarılar (kritik stok, açık
  zimmet) her seferinde backend'den canlı hesaplanır, okundu/okunmadı durumu
  saklanmaz.
- **Manuel müşteri iadesi yok** — "İadeler" sadece kuryenin gün sonunda otomatik
  yaptığı iadeleri gösterir; satılmış bir ürünün geri alınması ayrı bir iş kuralı
  gerektirir ve bu sürümde yok.
- **Ayarlar sayfası yok** — backend'de değiştirilebilecek bir ayar (config)
  bulunmuyor.
- Cari hesap/veresiye takibi, fatura, rota planlama, gerçek PostgreSQL kurulumu,
  mobil mağaza dağıtımı, push bildirim, çoklu bayi/şube desteği.
