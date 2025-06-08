import { prisma } from "@/lib/prisma";
import { authClient } from "@/lib/auth-client";

async function main() {
  console.log("🌱 Seeding database...");

  const admin = await authClient.signUp.email({
    email: "admin@admin.com",
    password: "password",
    name: "Admin",
  });

  console.log("✅ Admin user created", admin.error);

  // update role to admin
  const updatedAdmin = await prisma.user.update({
    where: {
      email: admin.data?.user?.email,
    },
    data: {
      role: "admin",
    },
  });

  console.log("✅ Admin user created", updatedAdmin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
