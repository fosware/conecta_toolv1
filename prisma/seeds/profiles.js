import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedProfiles() {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });
  const user = await prisma.user.findUnique({
    where: { email: "user@example.com" },
  });
  const moderator = await prisma.user.findUnique({
    where: { email: "moderator@example.com" },
  });

  if (!admin || !user || !moderator) {
    console.error(
      "Usuarios no encontrados. Asegúrate de ejecutar las semillas de usuarios primero."
    );
    return;
  }

  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      name: "Admin Name",
      first_lastname: "Admin Lastname",
      second_lastname: "Admin Second Lastname",
      phone: "1234567890",
      image_profile: null,
      userId: admin.id,
    },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      name: "User Name",
      first_lastname: "User Lastname",
      second_lastname: "User Second Lastname",
      phone: "0987654321",
      image_profile: null,
      userId: user.id,
    },
  });

  await prisma.profile.upsert({
    where: { userId: moderator.id },
    update: {},
    create: {
      name: "Moderator Name",
      first_lastname: "Moderator Lastname",
      second_lastname: "Moderator Second Lastname",
      phone: "1122334455",
      image_profile: null,
      userId: moderator.id,
    },
  });

  console.log("Perfiles sembrados correctamente.");
}
