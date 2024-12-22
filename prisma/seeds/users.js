import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedUsers() {
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedUserPassword = await bcrypt.hash("user123", 10);
  const hashedModeratorPassword = await bcrypt.hash("moderator123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedAdminPassword,
      username: "admin",
      roles: ["admin"],
    },
  });

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      password: hashedUserPassword,
      username: "user",
      roles: ["user"],
    },
  });

  await prisma.user.upsert({
    where: { email: "moderator@example.com" },
    update: {},
    create: {
      email: "moderator@example.com",
      password: hashedModeratorPassword,
      username: "moderator",
      roles: ["moderator"],
    },
  });

  console.log("Usuarios sembrados correctamente.");
}
