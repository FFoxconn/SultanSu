import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const ownerPassword = await hashPassword("patron123");
  const managerPassword = await hashPassword("yonetici123");
  const warehousePassword = await hashPassword("depo123");
  const courierPassword = await hashPassword("kurye123");

  const owner = await prisma.user.upsert({
    where: { phone: "5550000001" },
    update: {},
    create: {
      name: "Patron",
      phone: "5550000001",
      passwordHash: ownerPassword,
      role: "OWNER",
    },
  });

  const manager = await prisma.user.upsert({
    where: { phone: "5550000003" },
    update: {},
    create: {
      name: "Zeynep (Yönetici)",
      phone: "5550000003",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });

  const warehouse = await prisma.user.upsert({
    where: { phone: "5550000004" },
    update: {},
    create: {
      name: "Mehmet (Depo)",
      phone: "5550000004",
      passwordHash: warehousePassword,
      role: "WAREHOUSE",
    },
  });

  const courier = await prisma.user.upsert({
    where: { phone: "5550000002" },
    update: {},
    create: {
      name: "Ahmet (Kurye)",
      phone: "5550000002",
      passwordHash: courierPassword,
      role: "COURIER",
    },
  });

  const damacana19 = await prisma.product.upsert({
    where: { id: "seed-damacana-19l" },
    update: {},
    create: {
      id: "seed-damacana-19l",
      name: "19L Damacana",
      unit: "adet",
      price: 45,
      code: "URN-DMC19",
      minStock: 20,
      costPrice: 28,
      stockItem: { create: { quantity: 100 } },
    },
  });

  const damacana12 = await prisma.product.upsert({
    where: { id: "seed-damacana-12l" },
    update: {},
    create: {
      id: "seed-damacana-12l",
      name: "12L Damacana",
      unit: "adet",
      price: 30,
      code: "URN-DMC12",
      minStock: 15,
      costPrice: 19,
      stockItem: { create: { quantity: 60 } },
    },
  });

  // Kritik stok / tükendi durumlarının panelde gerçek veriyle görünmesi için bir örnek ürün.
  const damacana08 = await prisma.product.upsert({
    where: { id: "seed-damacana-08l" },
    update: {},
    create: {
      id: "seed-damacana-08l",
      name: "8L Damacana",
      unit: "adet",
      price: 20,
      code: "URN-DMC08",
      minStock: 10,
      costPrice: 13,
      stockItem: { create: { quantity: 4 } },
    },
  });

  console.log("Seed tamamlandı:");
  console.log(`  Patron    -> tel: ${owner.phone}  şifre: patron123`);
  console.log(`  Yönetici  -> tel: ${manager.phone}  şifre: yonetici123`);
  console.log(`  Depo      -> tel: ${warehouse.phone}  şifre: depo123`);
  console.log(`  Kurye     -> tel: ${courier.phone}  şifre: kurye123`);
  console.log(`  Ürünler   -> ${damacana19.name}, ${damacana12.name}, ${damacana08.name} (kritik stok örneği)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
