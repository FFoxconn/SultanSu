import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../index";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";

const app = createApp();

let ownerToken: string;
let managerToken: string;
let warehouseToken: string;
let courierToken: string;
let courierId: string;
let productId: string;

beforeAll(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.assignmentItem.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: { name: "Patron", phone: "5551110001", passwordHash: await hashPassword("patron123"), role: "OWNER" },
  });
  await prisma.user.create({
    data: { name: "Yönetici", phone: "5551110003", passwordHash: await hashPassword("yonetici123"), role: "MANAGER" },
  });
  await prisma.user.create({
    data: { name: "Depo", phone: "5551110004", passwordHash: await hashPassword("depo123"), role: "WAREHOUSE" },
  });
  const courier = await prisma.user.create({
    data: { name: "Kurye", phone: "5551110002", passwordHash: await hashPassword("kurye123"), role: "COURIER" },
  });
  courierId = courier.id;

  const login = async (phone: string, password: string) =>
    (await request(app).post("/api/auth/login").send({ phone, password })).body.token as string;

  ownerToken = await login("5551110001", "patron123");
  managerToken = await login("5551110003", "yonetici123");
  warehouseToken = await login("5551110004", "depo123");
  courierToken = await login("5551110002", "kurye123");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Faz 2 — RBAC ve yeni modüller", () => {
  it("WAREHOUSE ürün oluşturabilir, kritik stok eşiği (minStock) kaydedilir", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${warehouseToken}`)
      .send({ name: "Test Damacana", price: 40, initialStock: 5, minStock: 10 });
    expect(res.status).toBe(201);
    expect(res.body.minStock).toBe(10);
    expect(res.body.code).toMatch(/^URN-/);
    productId = res.body.id;
  });

  it("COURIER ürün oluşturamaz (403)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ name: "Yasak Ürün", price: 10, initialStock: 1 });
    expect(res.status).toBe(403);
  });

  it("WAREHOUSE zimmet oluşturamaz (403) ama MANAGER oluşturabilir", async () => {
    const forbidden = await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${warehouseToken}`)
      .send({ courierId, items: [{ productId, quantity: 5 }] });
    expect(forbidden.status).toBe(403);

    const created = await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ courierId, items: [{ productId, quantity: 5 }] });
    expect(created.status).toBe(201);
  });

  it("Zimmet oluşturma bir StockMovement (ASSIGN) kaydı bırakır", async () => {
    const res = await request(app)
      .get("/api/stock/movements")
      .set("Authorization", `Bearer ${warehouseToken}`);
    expect(res.status).toBe(200);
    const assignMovement = res.body.find((m: { type: string; productId: string }) => m.type === "ASSIGN" && m.productId === productId);
    expect(assignMovement).toBeTruthy();
    expect(assignMovement.quantity).toBe(-5);
  });

  let assignmentId: string;

  it("Kurye satış girer, zimmeti kapatır; İade ve StockMovement(RETURN) gerçek veriden oluşur", async () => {
    const active = await request(app).get("/api/assignments/active").set("Authorization", `Bearer ${courierToken}`);
    expect(active.status).toBe(200);
    assignmentId = active.body.id;

    const sale = await request(app)
      .post(`/api/assignments/${assignmentId}/sales`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ productId, quantity: 2 });
    expect(sale.status).toBe(201);

    const close = await request(app)
      .post(`/api/assignments/${assignmentId}/close`)
      .set("Authorization", `Bearer ${courierToken}`);
    expect(close.status).toBe(200);
    expect(close.body.items[0].quantityReturned).toBe(3);

    const returns = await request(app).get("/api/returns").set("Authorization", `Bearer ${ownerToken}`);
    expect(returns.status).toBe(200);
    const returned = returns.body.find((r: { assignmentId: string }) => r.assignmentId === assignmentId);
    expect(returned.quantityReturned).toBe(3);

    const sales = await request(app).get("/api/sales").set("Authorization", `Bearer ${ownerToken}`);
    expect(sales.body.some((s: { assignmentId: string; quantity: number }) => s.assignmentId === assignmentId && s.quantity === 2)).toBe(
      true
    );

    const movements = await request(app).get("/api/stock/movements?productId=" + productId).set("Authorization", `Bearer ${ownerToken}`);
    const returnMovement = movements.body.find((m: { type: string }) => m.type === "RETURN");
    expect(returnMovement.quantity).toBe(3);
  });

  it("Dashboard özeti gerçek veriden hesaplanır (kritik/tükenen stok, bugünkü satış)", async () => {
    const res = await request(app).get("/api/dashboard/summary").set("Authorization", `Bearer ${ownerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.kpis.soldToday).toBeGreaterThanOrEqual(2);
    // Test ürünü: minStock 10, kalan 3 -> kritik; ilk seed ürünleri burada yok (ayrı test DB).
    expect(res.body.kpis.criticalStockCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.alerts)).toBe(true);
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
    expect(res.body.recentActivity.length).toBeGreaterThan(0);
  });

  it("WAREHOUSE işlem geçmişini göremez (403), OWNER görebilir", async () => {
    const forbidden = await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${warehouseToken}`);
    expect(forbidden.status).toBe(403);

    const allowed = await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${ownerToken}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.some((log: { action: string }) => log.action === "assignment.close")).toBe(true);
  });

  it("Sadece OWNER yeni kullanıcı (rol atayarak) oluşturabilir; MANAGER oluşturamaz", async () => {
    const forbidden = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ name: "Yeni Depo", phone: "5551110099", password: "depo1234", role: "WAREHOUSE" });
    expect(forbidden.status).toBe(403);

    const created = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Yeni Depo", phone: "5551110099", password: "depo1234", role: "WAREHOUSE" });
    expect(created.status).toBe(201);
    expect(created.body.role).toBe("WAREHOUSE");

    const list = await request(app).get("/api/users").set("Authorization", `Bearer ${managerToken}`);
    expect(list.status).toBe(200);
    expect(list.body.some((u: { phone: string }) => u.phone === "5551110099")).toBe(true);
  });

  it("/api/sales ve /api/returns tarih aralığı (from/to) ile filtrelenebilir", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const salesInRange = await request(app)
      .get(`/api/sales?from=${today}&to=${tomorrow}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(salesInRange.status).toBe(200);
    expect(salesInRange.body.length).toBeGreaterThan(0);

    const salesOutOfRange = await request(app)
      .get(`/api/sales?from=2000-01-01&to=2000-01-02`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(salesOutOfRange.body.length).toBe(0);

    const returnsInRange = await request(app)
      .get(`/api/returns?from=${yesterday}&to=${tomorrow}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(returnsInRange.status).toBe(200);
    expect(returnsInRange.body.length).toBeGreaterThan(0);
  });
});
