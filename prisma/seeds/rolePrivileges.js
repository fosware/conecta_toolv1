import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedRolePrivileges() {
  // Obtén los roles desde la base de datos
  const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
  const staffRole = await prisma.role.findUnique({ where: { name: "Staff" } });
  const asociadoRole = await prisma.role.findUnique({
    where: { name: "Asociado" },
  });

  // Validar que los roles existan
  if (!adminRole || !staffRole || !asociadoRole) {
    console.error(
      "Roles no encontrados. Asegúrate de que los roles estén creados."
    );
    return;
  }

  // Mapear privilegios específicos para Admin
  const adminPrivileges = [
    "Dashboard",
    "Proyectos",
    "Asociados",
    "Clientes",
    "Cat Especialidades",
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
    "Solicitud de Proyectos",
    "Solicitudes Asignadas",
    "Administración de NDA's",
    "Reportes",
    "Gestión de Proyectos",
    "Manual",
  ];

  // Mapear privilegios específicos para Staff
  const staffPrivileges = [
    "Asociados",
    "Proyectos",
    "Solicitud de Proyectos",
    "Manual",
  ];

  // Mapear privilegios específicos para Asociado
  const asociadoPrivileges = [
    "Asociados",
    "Proyectos",
    "Solicitud de Proyectos",
    "Administración de NDA's",
    "Manual",
  ];

  // Función para asociar privilegios a un rol
  const assignPrivileges = async (roleId, privilegeNames) => {
    // Primero, eliminar todos los privilegios existentes para este rol
    await prisma.rolePrivilege.deleteMany({
      where: { roleId },
    });

    // Luego, asignar los nuevos privilegios
    for (const privilegeName of privilegeNames) {
      const privilege = await prisma.privilege.findUnique({
        where: { name: privilegeName },
      });

      if (!privilege) {
        console.warn(`Privilegio no encontrado: ${privilegeName}`);
        continue;
      }

      await prisma.rolePrivilege.create({
        data: {
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

  // Asignar privilegios a Asociado
  await assignPrivileges(asociadoRole.id, asociadoPrivileges);

  console.log(
    "Relaciones entre Roles y Privilegios actualizadas correctamente."
  );
}
