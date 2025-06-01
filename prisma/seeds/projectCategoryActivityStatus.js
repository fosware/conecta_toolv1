import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectCategoryActivityStatusValues = [
  { name: "Por Iniciar", userId: 1 },
  { name: "En Progreso", userId: 1 },
  { name: "Finalizado", userId: 1 },
  { name: "Cancelado", userId: 1 },
];

export async function seedProjectCategoryActivityStatus() {
  for (const projectCategoryActivityStatus of projectCategoryActivityStatusValues) {
    await prisma.projectCategoryActivityStatus.upsert({
      where: {
        name: projectCategoryActivityStatus.name,
        userId: projectCategoryActivityStatus.userId,
      },
      update: {},
      create: projectCategoryActivityStatus,
    });
  }
  console.log("Status de actividades sembrados correctamente.");
}
