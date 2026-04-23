import { PrismaClient } from "@prisma/client";

async function bootstrapAdmin() {
  const rawEmail = process.env.ADMIN_EMAIL;
  if (!rawEmail) {
    console.log("ADMIN_EMAIL not set, skipping admin bootstrap.");
    return;
  }

  const adminEmail = rawEmail.trim().toLowerCase();
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "admin" },
      create: { email: adminEmail, role: "admin" },
    });
    console.log(`Admin user ensured: ${user.email} (id: ${user.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapAdmin().catch((err) => {
  console.error("Failed to bootstrap admin:", err);
  process.exit(1);
});
