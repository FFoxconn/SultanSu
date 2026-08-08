import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../index";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth";

const app = createApp();

let ownerToken: string;
let courierToken: string;
let courierId: string;
let productId: string;
let assignmentId: string;

beforeAll(async () => {
  await prisma.sale.deleteMany();
  await prisma.assignmentItem.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      name: "Patron",
      phone: "5550000001",
      passwordHash: await hashPassword("patron123"),
      role: "OWNER",
    },
  });

  const courier = await prisma.user.create({
    data: {
      name: "Ahmet (Kurye)",
      phone: "5550000002",
      passwordHash: await hashPassword("kurye123"),
      role: "COURIER",
    },
  });
  courierId = courier.id;

  const product = await prisma.product.create({
    data: {
      name: "19L Damacana",
      unit: "adet",
      price: 45,
      stockItem: { create: { quantity: 100 } },
    },
  });
  productId = product.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Kurye satış / iade senaryosu (Patron su bayisi)", () => {
  it("patron login olur", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ phone: "5550000001", password: "patron123" });
    expect(res.status).toBe(200);
    ownerToken = res.body.token;
  });

  it("kurye login olur", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ phone: "5550000002", password: "kurye123" });
    expect(res.status).toBe(200);
    courierToken = res.body.token;
  });

  it("patron kuryeye 20 damacana zimmetler, depo stoğu düşer", async () => {
    const res = await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ courierId, items: [{ productId, quantity: 20 }] });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("OPEN");
    expect(res.body.items[0].quantityAssigned).toBe(20);
    assignmentId = res.body.id;

    const stock = await request(app).get("/api/stock").set("Authorization", `Bearer ${ownerToken}`);
    const item = stock.body.find((s: { productId: string }) => s.productId === productId);
    expect(item.quantity).toBe(80); // 100 - 20
  });

  it("aynı kurye için ikinci açık zimmet oluşturulamaz", async () => {
    const res = await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ courierId, items: [{ productId, quantity: 1 }] });
    expect(res.status).toBe(409);
  });

  it("kurye mobilden bugünkü zimmetini görür (20 kalan)", async () => {
    const res = await request(app)
      .get("/api/assignments/active")
      .set("Authorization", `Bearer ${courierToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(assignmentId);
    expect(res.body.items[0].quantityRemaining).toBe(20);
  });

  it("kurye gün içinde mobilden toplam 15 adet satış girer", async () => {
    for (const quantity of [5, 7, 3]) {
      const res = await request(app)
        .post(`/api/assignments/${assignmentId}/sales`)
        .set("Authorization", `Bearer ${courierToken}`)
        .send({ productId, quantity });
      expect(res.status).toBe(201);
    }

    const detail = await request(app)
      .get(`/api/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${courierToken}`);
    expect(detail.body.items[0].quantitySold).toBe(15);
    expect(detail.body.items[0].quantityRemaining).toBe(5);
    expect(detail.body.totalSalesAmount).toBe(15 * 45);
  });

  it("zimmette kalandan fazlası satılamaz", async () => {
    const res = await request(app)
      .post(`/api/assignments/${assignmentId}/sales`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ productId, quantity: 6 });
    expect(res.status).toBe(400);
  });

  it("kurye günü kapatır: kalan 5 damacana otomatik depoya iade edilir", async () => {
    const res = await request(app)
      .post(`/api/assignments/${assignmentId}/close`)
      .set("Authorization", `Bearer ${courierToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CLOSED");
    expect(res.body.items[0].quantityReturned).toBe(5);

    const stock = await request(app).get("/api/stock").set("Authorization", `Bearer ${ownerToken}`);
    const item = stock.body.find((s: { productId: string }) => s.productId === productId);
    expect(item.quantity).toBe(85); // 80 + 5 iade
  });

  it("kapalı zimmete tekrar satış girilemez", async () => {
    const res = await request(app)
      .post(`/api/assignments/${assignmentId}/sales`)
      .set("Authorization", `Bearer ${courierToken}`)
      .send({ productId, quantity: 1 });
    expect(res.status).toBe(400);
  });

  it("patron günlük raporda kuryenin zimmet/satış/iade özetini görür", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await request(app)
      .get(`/api/reports/daily?date=${today}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    const row = res.body.couriers.find(
      (c: { courier: { id: string } }) => c.courier.id === courierId
    );
    expect(row.totalAssigned).toBe(20);
    expect(row.totalSold).toBe(15);
    expect(row.totalReturned).toBe(5);
    expect(row.totalRevenue).toBe(675);
  });
});
