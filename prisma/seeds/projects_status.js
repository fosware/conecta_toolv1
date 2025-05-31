import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectStatusValues = [
  { name: "Por Iniciar", userId: 1 },
  { name: "En Proceso", userId: 1 },
  { name: "Finalizado", userId: 1 },
  { name: "Cancelado", userId: 1 },
];

export async function seedProjectApprovedStatus() {
  for (const projectStatus of projectStatusValues) {
    await prisma.projectStatus.upsert({
      where: { name: projectStatus.name, userId: projectStatus.userId },
      update: {},
      create: projectStatus,
    });
  }
  console.log("Status de proyectos aprobados sembrados correctamente.");
}
