# SultanSu — Bayi Yönetim Sistemi (Faz 1: Kurye Satış / İade)

Su bayileri için: Patron kuryeye ürün zimmetler (ör. 20 damacana), kurye gün içinde
sattığı ürünleri mobil uygulamadan satış olarak girer, gün sonunda "Günü Kapat"
dediğinde satılmayan ürünler otomatik olarak depo stoğuna **iade** edilir.

## Proje yapısı

```
backend/   Express + TypeScript + Prisma (SQLite, dev) — REST API
web/       React + Vite — Patron/Bayi yönetim paneli
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
npm run seed                # demo Patron + Kurye + ürünler
npm run dev                 # http://localhost:4000
```

Demo hesaplar (seed sonrası):

| Rol    | Telefon    | Şifre      |
|--------|-----------|------------|
| Patron | 5550000001 | patron123 |
| Kurye  | 5550000002 | kurye123  |

Testler (ayrı `prisma/test.db` üzerinde çalışır, `npm test` çalıştırınca otomatik
şema push edilir):

```bash
npm test
```

### Web paneli (Patron)

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

1. **Patron (web)** → *Zimmet Oluştur*: kurye + ürün/miktar seçer (örn. 20 damacana).
   Depo stoğundan otomatik düşülür.
2. **Kurye (mobil)** → *Bugünkü Zimmetim* ekranında zimmetini görür, gün içinde her
   satışta *Satış Ekle* ile ürün+miktar girer.
3. Akşam kurye *Günü Kapat* der → satılmayan miktar otomatik olarak depo stoğuna
   **iade** edilir, zimmet `CLOSED` durumuna geçer.
4. **Patron (web)** → *Zimmetler* / *Raporlar* sayfalarında kurye bazlı
   zimmet/satış/iade/ciro özetini görür.

## Kapsam dışı (sonraki faz)

Cari hesap/veresiye takibi, fatura, rota planlama, gerçek PostgreSQL kurulumu,
mobil mağaza dağıtımı, push bildirim, çoklu bayi/şube desteği.
