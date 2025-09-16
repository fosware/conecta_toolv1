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
  { name: "No seleccionado", userId: 1 },
  { name: "Revisión Ok", userId: 1 },
  { name: "Cotización generada para Cliente", userId: 1 },
  { name: "Cotización enviada al Cliente", userId: 1 },
  { name: "Cotización rechazada por el Cliente", userId: 1 },
  { name: "Cotización seleccionada", userId: 1 },
  { name: "Cotización aprobada por el Cliente", userId: 1 },
  { name: "Proyecto Autorizado", userId: 1 },
  { name: "Finalizado", userId: 1 },
  { name: "En espera de aprobación", userId: 1 },
  { name: "Recibida", userId: 1 },
  { name: "Gestión de Requerimientos", userId: 1 },
  { name: "En proceso", userId: 1 },
  { name: "Cotizado", userId: 1 },
  { name: "Rechazada", userId: 1 },
  { name: "Aceptada", userId: 1 },
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
