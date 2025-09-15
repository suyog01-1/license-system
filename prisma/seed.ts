import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create Admin
  const admin = await prisma.admin.create({
    data: {
      email: "admin@example.com",
      password: "12345", // Plain password (no hashing)
    },
  });

  // Create Reseller
  const reseller = await prisma.reseller.create({
    data: {
      username: "reseller1",
      password: "12345",
    },
  });

  console.log("Seed completed:");
  console.log({ admin, reseller });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
