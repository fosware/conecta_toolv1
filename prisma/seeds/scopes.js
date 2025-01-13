import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const scopes = [
  /* Acabados superficiales */
  { name: "Anodizado", num: 1, specialtyId: 1 },
  { name: "Anodizado duro", num: 2, specialtyId: 1 },
  { name: "Aluminium clear cromate", num: 3, specialtyId: 1 },
  { name: "Anodizado con sello de teflón", num: 4, specialtyId: 1 },
  { name: "Electropulido", num: 5, specialtyId: 1 },
  { name: "Estañado", num: 6, specialtyId: 1 },
  { name: "Galvanizado / zincado", num: 7, specialtyId: 1 },
  { name: "Niquel esetroless", num: 8, specialtyId: 1 },
  { name: "Niquel electrolítico", num: 9, specialtyId: 1 },
  { name: "Pasivado", num: 10, specialtyId: 1 },
  { name: "Pavonado", num: 11, specialtyId: 1 },

  /* Corte con laser */
  { name: "Plano", num: 1, specialtyId: 3 },
  { name: "Tubular", num: 2, specialtyId: 3 },
  /* Herramienta de corte */
  { name: "Fabricación y distribución", num: 1, specialtyId: 10 },
  { name: "Distribución", num: 2, specialtyId: 10 },
  /* Hule */
  { name: "Diseño de compuestos", num: 1, specialtyId: 11 },
  { name: "Vulcanizado", num: 2, specialtyId: 11 },
  /* Maquinados horizontales */
  { name: "Horizontales", num: 1, specialtyId: 12 },
  { name: "Verticales", num: 2, specialtyId: 12 },
  /* Moldes */
  { name: "Diseño", num: 1, specialtyId: 14 },
  { name: "Fabricación", num: 2, specialtyId: 14 },
  { name: "Reparación", num: 3, specialtyId: 14 },
  /* Rectificado */
  { name: "Cilíndrico", num: 1, specialtyId: 16 },
  { name: "Plano", num: 2, specialtyId: 16 },
  { name: "De rosca", num: 3, specialtyId: 16 },
  /* Recubrimientos */
  { name: "Pintura electroestática batch", num: 1, specialtyId: 17 },
  { name: "Pintura electroestática en cadena", num: 2, specialtyId: 17 },
  { name: "Pintura líquida", num: 3, specialtyId: 17 },
  { name: "Rociado térmico", num: 4, specialtyId: 17 },
  /* Tratamientos térmicos */
  { name: "Nitrurado", num: 1, specialtyId: 22 },
  { name: "Tempaldo en sales", num: 2, specialtyId: 22 },
  { name: "Templado al vacío", num: 3, specialtyId: 22 },
  /* Troqueles */
  { name: "Diseño", num: 1, specialtyId: 24 },
  { name: "Fabricación", num: 2, specialtyId: 24 },
  { name: "Reparación", num: 3, specialtyId: 24 },
];

export async function seedScopes() {
  for (const scope of scopes) {
    await prisma.scopes.upsert({
      where: { name: scope.name },
      update: {},
      create: {
        name: scope.name,
        num: scope.num,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        specialty: { connect: { id: scope.specialtyId } },
        user: { connect: { id: 1 } }, // Actualiza con un ID válido
      },
    });
  }
  console.log("Alcances sembrados correctamente.");
}
