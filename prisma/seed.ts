import { PrismaClient } from '@prisma/client';
import { seedAll } from './seeds/index.js';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Iniciando proceso de seeding...");
    await seedAll();
    console.log("Seeding completado exitosamente");
  } catch (error) {
    console.error("Error durante el seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("Error en el proceso principal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
