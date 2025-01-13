import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const specialties = [
  { name: "Acabados y superficiales", num: 1 },
  { name: "Automatización", num: 2 },
  { name: "Corte con laser", num: 3 },
  { name: "Diseño mecánico", num: 4 },
  { name: "Doblez", num: 5 },
  { name: "Ensamble", num: 6 },
  { name: "Estampados", num: 7 },
  { name: "Fixtures / Gigs", num: 8 },
  { name: "Herramentales", num: 9 },
  { name: "Herramientas de corte", num: 10 },
  { name: "Hule", num: 11 },
  { name: "Maquinados horizontales", num: 12 },
  { name: "Metrología dimensional", num: 13 },
  { name: "Moldes", num: 14 },
  { name: "Punzonado", num: 15 },
  { name: "Rectificado", num: 16 },
  { name: "Recubrimientos", num: 17 },
  { name: "Servicio de escaneo", num: 18 },
  { name: "Soldadura", num: 19 },
  { name: "Subensambles", num: 20 },
  { name: "Submaquilas", num: 21 },
  { name: "Tratamientos térmicos", num: 22 },
  { name: "Troquelado", num: 23 },
  { name: "Troqueles", num: 24 },
];

export async function seedSpecialties() {
  for (const specialty of specialties) {
    await prisma.specialties.upsert({
      where: { name: specialty.name },
      update: {},
      create: {
        ...specialty,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { connect: { id: 1 } }, // Actualizar con un ID válido
      },
    });
  }
  console.log("Specialties seeded successfully.");
}
