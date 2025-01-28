import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedLocationStates() {
  const states = [
    { name: "Aguascalientes", country: "México" },
    { name: "Baja California", country: "México" },
    { name: "Baja California Sur", country: "México" },
    { name: "Campeche", country: "México" },
    { name: "Chiapas", country: "México" },
    { name: "Chihuahua", country: "México" },
    { name: "Ciudad de México", country: "México" },
    { name: "Coahuila", country: "México" },
    { name: "Colima", country: "México" },
    { name: "Durango", country: "México" },
    { name: "Estado de México", country: "México" },
    { name: "Guanajuato", country: "México" },
    { name: "Guerrero", country: "México" },
    { name: "Hidalgo", country: "México" },
    { name: "Jalisco", country: "México" },
    { name: "Michoacán", country: "México" },
    { name: "Morelos", country: "México" },
    { name: "Nayarit", country: "México" },
    { name: "Nuevo León", country: "México" },
    { name: "Oaxaca", country: "México" },
    { name: "Puebla", country: "México" },
    { name: "Querétaro", country: "México" },
    { name: "Quintana Roo", country: "México" },
    { name: "San Luis Potosí", country: "México" },
    { name: "Sinaloa", country: "México" },
    { name: "Sonora", country: "México" },
    { name: "Tabasco", country: "México" },
    { name: "Tamaulipas", country: "México" },
    { name: "Tlaxcala", country: "México" },
    { name: "Veracruz", country: "México" },
    { name: "Yucatán", country: "México" },
    { name: "Zacatecas", country: "México" }
  ];

  console.log('Seeding location states...');
  for (const state of states) {
    await prisma.locationState.upsert({
      where: {
        name_country: {
          name: state.name,
          country: state.country
        }
      },
      update: {},
      create: state
    });
  }
  console.log('Location states seeded successfully');
}
