import { seedRoles } from "./roles.js";
import { seedUsers } from "./users.js";
import { seedProfiles } from "./profiles.js";

export async function seedAll() {
  await seedRoles();
  await seedUsers();
  await seedProfiles();
  console.log("Todas las semillas ejecutadas correctamente.");
}
