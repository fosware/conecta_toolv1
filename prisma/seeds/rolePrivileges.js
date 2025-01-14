import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedRolePrivileges() {
  // Obtén los roles desde la base de datos
  const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
  const staffRole = await prisma.role.findUnique({ where: { name: "Staff" } });

  // Validar que los roles existan
  if (!adminRole || !staffRole) {
    console.error(
      "Roles no encontrados. Asegúrate de que los roles estén creados."
    );
    return;
  }

  // Mapear privilegios específicos para Admin
  const adminPrivileges = [
    "Dashboard",
    "Projects",
    "Asociados",
    "Clientes",
    "Especialidades",
    "Certificaciones",
    "Usuarios",
    "View Reports",
    "Edit Projects",
    "Create Projects",
    "Delete Projects",
    "Approve Projects",
    "Assign Roles",
    "Update Clients",
    "Cat Certificaciones",
  ];

  // Mapear privilegios específicos para Staff
  const staffPrivileges = [
    "Dashboard",
    "Proyectos",
    "View Reports",
    "Edit Projects",
  ];

  // Función para asociar privilegios a un rol
  const assignPrivileges = async (roleId, privilegeNames) => {
    for (const privilegeName of privilegeNames) {
      const privilege = await prisma.privilege.findUnique({
        where: { name: privilegeName },
      });

      if (!privilege) {
        console.warn(`Privilegio no encontrado: ${privilegeName}`);
        continue;
      }

      await prisma.rolePrivilege.upsert({
        where: {
          roleId_privilegeId: { roleId, privilegeId: privilege.id },
        },
        update: {},
        create: {
          roleId,
          privilegeId: privilege.id,
        },
      });
    }
  };

  // Asignar privilegios a Admin
  await assignPrivileges(adminRole.id, adminPrivileges);

  // Asignar privilegios a Staff
  await assignPrivileges(staffRole.id, staffPrivileges);

  console.log("Relaciones entre Roles y Privilegios creadas correctamente.");
}
