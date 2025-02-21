import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectTypesValues = [{ name: "Total" }, { name: "Segmentado" }];

export async function seedProjectTypes() {
  for (const projectType of projectTypesValues) {
    await prisma.projectTypes.upsert({
      where: { name: projectType.name },
      update: {},
      create: projectType,
    });
  }
  console.log("Tipos de proyecto sembrados correctamente.");
}
