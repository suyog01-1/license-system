// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create Admin
  const admin = await prisma.admin.create({
    data: {
      email: "admin@example.com",
      password: "admin123", // ❗ you should hash this in production
    },
  });

  // Create Reseller (actually a User with role="reseller")
  const reseller = await prisma.user.create({
    data: {
      username: "reseller1",
      email: "reseller1@example.com",
      password: "12345", // ❗ hash in production
      role: "reseller",
      credits: 100,
    },
  });

  // Create normal User
  const user = await prisma.user.create({
    data: {
      username: "user1",
      email: "user1@example.com",
      password: "12345",
      role: "user",
    },
  });

  // Create License for user
  const license = await prisma.license.create({
    data: {
      username: "user1-license",
      password: "12345",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // +30 days
      createdBy: reseller.username,
      role: "user",
      userId: user.id,
    },
  });

  console.log({ admin, reseller, user, license });
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
