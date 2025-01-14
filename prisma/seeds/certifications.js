import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const certifications = [
  { name: "ISO9000", description: "Descripción ISO9000", userId: 1 },
  { name: "ISO9001", description: "Descripción ISO9001", userId: 1 },
  { name: "ISO9002", description: "Descripción ISO9002", userId: 1 },
];

export async function seedCertifications() {
  for (const certification of certifications) {
    await prisma.certifications.upsert({
      where: {
        name: certification.name,
        description: certification.description,
      },
      update: {},
      create: certification,
    });
  }
  console.log("Certificaciones sembradas correctamente.");
}
