import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectApprovedStatusValues = [
  { name: "Por Iniciar", userId: 1 },
  { name: "En Proceso", userId: 1 },
  { name: "Finalizado", userId: 1 },
  { name: "Cancelado", userId: 1 },
];

export async function seedProjectApprovedStatus() {
  for (const projectApprovedStatus of projectApprovedStatusValues) {
    await prisma.projectStatus.upsert({
      where: {
        name: projectApprovedStatus.name,
        userId: projectApprovedStatus.userId,
      },
      update: {},
      create: projectApprovedStatus,
    });
  }
  console.log("Status de proyectos aprobados sembrados correctamente.");
}
