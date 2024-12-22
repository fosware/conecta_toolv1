import { seedAll } from "./seeds/index.js";
import { PrismaClient } from "@prisma/client";

//const prisma = new PrismaClient();

async function main() {
  await seedAll();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    //const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  });
