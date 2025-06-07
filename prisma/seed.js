import { v4 as uuid } from "uuid";
import { prisma } from "./prisma";

async function main() {
  console.log("🌱 Seeding database...");

  const user = await prisma.user
    .create({
      data: {
        name: "Admin",
        email: "admin@admin.com",
        role: "admin",
        id: uuid(),
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .select({ id: true });

  await prisma.account.create({
    data: {
      userId: user.id,
      type: "email",
      provider: "email",
      providerId: "credential",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Admin user created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
