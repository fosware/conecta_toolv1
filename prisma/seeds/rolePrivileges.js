import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedRolePrivileges() {
  const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
  const privileges = await prisma.privilege.findMany();

  if (!adminRole || !privileges.length) {
    console.error("Roles o Privilegios no encontrados.");
    return;
  }

  for (const privilege of privileges) {
    await prisma.rolePrivilege.create({
      data: {
        roleId: adminRole.id,
        privilegeId: privilege.id,
      },
    });
  }

  console.log("Relaciones entre Roles y Privilegios creadas correctamente.");
}
