import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedRoles() {
  await prisma.role.createMany({
    data: [{ name: "admin" }, { name: "user" }, { name: "moderator" }],
    skipDuplicates: true, // Evitar errores si los roles ya existen
  });

  console.log("Roles sembrados correctamente.");
}
