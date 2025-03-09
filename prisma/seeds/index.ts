import { seedRoles } from "./roles.js";
import { seedPrivileges } from "./privileges.js";
import { seedUsers } from "./users.js";
import { seedRolePrivileges } from "./rolePrivileges.js";
import { seedSpecialties } from "./specialties.js";
import { seedScopes } from "./scopes.js";
import { seedSubscopes } from "./subscopes.js";
import { seedCertifications } from "./certifications.js";
import { seedLocationStates } from "./locationStates.js";
import { seedProjectTypes } from "./projectTypes.js";
import { seedProjectStatus } from "./statusProjectRequest.js";

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
    await seedLocationStates();
    console.log("Estados sembrados.");
    await seedSpecialties();
    console.log("Especialdiades sembradas.");
    await seedScopes();
    console.log("Alcances sembradas.");
    await seedSubscopes();
    console.log("Subalcances sembradas.");
    await seedCertifications();
    console.log("Certificaciones sembradas.");
    await seedProjectTypes();
    console.log("Tipos de proyecto sembrados correctamente.");
    await seedProjectStatus();
    console.log("Status de proyecto sembrados correctamente.");

    console.log("Semillas completadas.");
  } catch (error) {
    console.error("Error al ejecutar semillas:", error);
  }
}
// npx prisma migrate dev --name update_models || npx prisma db push
// npx prisma generate
// npm run prisma:seed
// seedAll();
