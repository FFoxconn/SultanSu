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
mobile/    Flutter (Dart) — Kurye mobil uygulaması
```

## Kurulum

`backend` ve `web` npm workspaces olarak tek `npm install` ile kurulur; `mobile`
ayrı bir Flutter projesidir (npm workspace'i değildir), kendi bölümünde anlatılan
`flutter pub get` ile kurulur.

```bash
cd backend && npm install
cd ../web && npm install
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

### Mobil uygulama (Kurye) — Flutter

Flutter SDK gerekir (kurulu değilse: https://docs.flutter.dev/get-started/install/windows).

```bash
cd mobile
flutter pub get
flutter doctor        # Android toolchain/telefon algılanıyor mu kontrol edin
```

**Android telefonu USB ile bağlayıp çalıştırma:**

1. Telefonda Ayarlar → Telefon Hakkında → "Yapı Numarası"na 7 kez dokunup
   Geliştirici Seçenekleri'ni açın, ardından "USB Hata Ayıklama"yı etkinleştirin.
2. Telefonu USB ile bağlayın, çıkan "USB hata ayıklamaya izin ver?" uyarısını onaylayın.
3. `adb devices` ile telefonun `device` olarak göründüğünü doğrulayın (adb yoksa
   [platform-tools](https://developer.android.com/tools/releases/platform-tools) indirin).
4. Backend'i çalışır durumda bırakıp şu tüneli açın (telefondaki `localhost`'u
   bilgisayardaki backend'e yönlendirir, `mobile` kodunda IP değiştirmeye gerek kalmaz):
   ```bash
   adb reverse tcp:4000 tcp:4000
   ```
5. `flutter run` çalıştırın (birden fazla cihaz varsa `-d <device-id>` ile seçin).

Kurye giriş bilgileri: `5550000002` / `kurye123`.

Not: `mobile/lib/api/api_client.dart` içindeki `apiBaseUrl` sabiti Wi-Fi üzerinden
test ederken bilgisayarınızın yerel ağ IP'siyle güncellenmeli (ör.
`http://192.168.1.20:4000/api`) — USB + `adb reverse` akışında `localhost` olarak kalabilir.

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
