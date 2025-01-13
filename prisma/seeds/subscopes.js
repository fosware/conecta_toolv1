import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const subscopes = [
  { name: "Anodizado básico", num: 1, scopeId: 1, userId: 1 },
  { name: "Anodizado especializado", num: 2, scopeId: 1, userId: 1 },
  { name: "Corte por láser plano", num: 1, scopeId: 12, userId: 1 },
  { name: "Corte por láser tubular", num: 2, scopeId: 12, userId: 1 },
  // Agrega más subalcances según sea necesario
];

export async function seedSubscopes() {
  for (const subscope of subscopes) {
    await prisma.subscopes.upsert({
      where: { name: subscope.name },
      update: {},
      create: {
        name: subscope.name,
        num: subscope.num,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        scope: { connect: { id: subscope.scopeId } }, // Relación con Scopes
        user: { connect: { id: subscope.userId } }, // Relación con User
      },
    });
  }
  console.log("Subalcances sembrados correctamente.");
}
