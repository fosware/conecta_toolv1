import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const privileges = [
  { name: "Manage Users" },
  { name: "View Reports" },
  { name: "Edit Projects" },
];

export async function seedPrivileges() {
  for (const privilege of privileges) {
    await prisma.privilege.upsert({
      where: { name: privilege.name },
      update: {},
      create: privilege,
    });
  }
  console.log("Privilegios sembrados correctamente.");
}
