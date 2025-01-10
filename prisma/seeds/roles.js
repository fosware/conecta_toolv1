import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  { name: "Admin", prefix: "AD" },
  { name: "Staff", prefix: "TS" },
  { name: "Asociado", prefix: "AS" },
  { name: "Cliente", prefix: "CL" },
];

export async function seedRoles() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log("Roles sembrados correctamente.");
}
