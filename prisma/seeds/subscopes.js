import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const subscopes = [
  { name: "Machuelos estándares y especiales", num: 1, scopeId: 14, userId: 1 },
  { name: "Tarrajas", num: 2, scopeId: 14, userId: 1 },
  { name: "Brocas", num: 1, scopeId: 15, userId: 1 },
  { name: "Insertos", num: 2, scopeId: 15, userId: 1 },
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
