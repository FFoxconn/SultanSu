import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const ownerPassword = await hashPassword("patron123");
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
      stockItem: { create: { quantity: 60 } },
    },
  });

  console.log("Seed tamamlandı:");
  console.log(`  Patron  -> tel: ${owner.phone}  şifre: patron123`);
  console.log(`  Kurye   -> tel: ${courier.phone}  şifre: kurye123`);
  console.log(`  Ürünler -> ${damacana19.name}, ${damacana12.name}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
