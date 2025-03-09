import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectSatatusValues = [
  { name: "Creado", userId: 1 },
  { name: "En espera de firma NDA", userId: 1 },
  { name: "Firmado por Asociado", userId: 1 },
  { name: "Espera de Documentos Técnicos", userId: 1 },
  { name: "Finalizado", userId: 1 },
];

export async function seedProjectStatus() {
  for (const projectStatus of projectSatatusValues) {
    await prisma.statusProjectRequest.upsert({
      where: { name: projectStatus.name },
      update: {},
      create: projectStatus,
    });
  }
  console.log("Tipos de proyecto sembrados correctamente.");
}
