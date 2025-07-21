import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const privileges = [
  { name: "Proyectos" },
  { name: "Asociados" },
  { name: "Clientes" },
  { name: "Cat Especialidades" },
  { name: "Certificaciones" },
  { name: "Usuarios" },
  { name: "Cat Certificaciones" },
  { name: "Solicitud de Proyectos" },
  { name: "Solicitudes Asignadas" },
  { name: "Administración de NDA's" },
  { name: "Reportes" },
  { name: "Gestión de Proyectos" },
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
