import { prisma } from "@/lib/prisma";

/**
 * Obtiene la fecha y hora actual directamente del servidor PostgreSQL usando NOW()
 * para asegurar consistencia en la zona horaria con la base de datos
 * @returns Promise<Date> Fecha actual del servidor PostgreSQL
 */
export async function getDateFromServer(): Promise<Date> {
  // Obtenemos la fecha como string para evitar conversiones automáticas de zona horaria
  const result = await prisma.$queryRaw<{ now_str: string }[]>`SELECT NOW()::text as now_str`;
  
  // Parseamos la fecha manualmente para mantener la zona horaria correcta
  const dateStr = result[0].now_str;
  
  // Formato esperado: YYYY-MM-DD HH:MM:SS.mmm+TZ
  const [datePart, timePart] = dateStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hoursStr, minutesStr, secondsWithMs] = timePart.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const seconds = parseInt(secondsWithMs.split('.')[0], 10);
  const milliseconds = parseInt(secondsWithMs.split('.')[1] || '0', 10);
  
  // Creamos la fecha en la zona horaria local
  // Restamos 1 al mes porque en JavaScript los meses van de 0 a 11
  const date = new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
  
  // Registramos para depuración
  console.log(`Fecha original de PostgreSQL: ${dateStr}`);
  console.log(`Fecha parseada: ${date.toISOString()}`);
  console.log(`Fecha local: ${date.toString()}`);
  
  return date;
}
