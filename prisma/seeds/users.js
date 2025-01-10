import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedUsers() {
  // Obtén los roles desde la base de datos
  const adminRole = await prisma.role.findUnique({
    where: { name: "Admin" },
  });
  const staffRole = await prisma.role.findUnique({ where: { name: "Staff" } });
  const clientRole = await prisma.role.findUnique({
    where: { name: "Cliente" },
  });

  if (!adminRole || !staffRole || !clientRole) {
    console.error(
      "Faltan roles en la base de datos. Asegúrate de ejecutar la semilla de roles primero."
    );
    return;
  }

  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedUserPassword = await bcrypt.hash("user123", 10);
  const hashedStaffPassword = await bcrypt.hash("staff123", 10);

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedAdminPassword,
      username: "admin",
      roleId: adminRole.id,
      profile: {
        create: {
          name: "Admin",
          first_lastname: "Principal",
          phone: "1234567890",
          image_profile: null,
        },
      },
    },
  });

  // Staff
  await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      email: "staff@example.com",
      password: hashedStaffPassword,
      username: "staff",
      roleId: staffRole.id,
      profile: {
        create: {
          name: "Staff",
          first_lastname: "Team",
          phone: "0987654321",
          image_profile: null,
        },
      },
    },
  });

  // Cliente
  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      password: hashedUserPassword,
      username: "client",
      roleId: clientRole.id,
      profile: {
        create: {
          name: "Cliente",
          first_lastname: "General",
          phone: "1122334455",
          image_profile: null,
        },
      },
    },
  });

  console.log("Usuarios sembrados correctamente.");
}
