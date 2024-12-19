import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Crear roles (si no están creados)
  await prisma.role.createMany({
    data: [{ name: "admin" }, { name: "user" }, { name: "moderator" }],
    skipDuplicates: true, // Evitar errores si los roles ya existen
  });

  // Hashear contraseñas
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedUserPassword = await bcrypt.hash("user123", 10);
  const hashedModeratorPassword = await bcrypt.hash("moderator123", 10);

  // Crear usuarios usando upsert
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {}, // Si ya existe, no hacemos cambios
    create: {
      email: "admin@example.com",
      password: hashedAdminPassword,
      username: "admin",
      roles: ["admin"],
    },
  });

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {}, // Si ya existe, no hacemos cambios
    create: {
      email: "user@example.com",
      password: hashedUserPassword,
      username: "user",
      roles: ["user"],
    },
  });

  await prisma.user.upsert({
    where: { email: "moderator@example.com" },
    update: {}, // Si ya existe, no hacemos cambios
    create: {
      email: "moderator@example.com",
      password: hashedModeratorPassword,
      username: "moderator",
      roles: ["moderator"],
    },
  });

  console.log("Seed ejecutado correctamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
