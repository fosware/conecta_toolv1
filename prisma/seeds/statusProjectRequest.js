import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectSatatusValues = [
  { name: "Procesando", userId: 1 },
  { name: "Asociado seleccionado", userId: 1 },
  { name: "En espera de firma NDA", userId: 1 },
  { name: "Firmado por Asociado", userId: 1 },
  { name: "En espera de Documentos Técnicos", userId: 1 },
  { name: "Documentos técnicos enviados", userId: 1 },
  { name: "Cotización enviada", userId: 1 },
  { name: "Cotización rechazada", userId: 1 },
  { name: "Cotización aprobada", userId: 1 },
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
  console.log("Status de proyectos sembrados correctamente.");
}
