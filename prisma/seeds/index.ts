import { seedRoles } from "./roles.js";
import { seedPrivileges } from "./privileges.js";
import { seedUsers } from "./users.js";
import { seedRolePrivileges } from "./rolePrivileges.js";

export async function seedAll() {
  try {
    console.log("Iniciando proceso de semillas...");
    await seedRoles();
    console.log("Roles sembrados.");
    await seedPrivileges();
    console.log("Privilegios sembrados.");
    await seedUsers();
    console.log("Usuarios sembrados.");
    await seedRolePrivileges();
    console.log("Relaciones de privilegios sembradas.");
    console.log("Semillas completadas.");
  } catch (error) {
    console.error("Error al ejecutar semillas:", error);
  }
}

//seedAll();
