import { prisma } from "@/lib/prisma";

/**
 * Obtiene la fecha y hora actual directamente del servidor PostgreSQL usando NOW()
 * para asegurar consistencia en la zona horaria con la base de datos
 * @returns Promise<Date> Fecha actual del servidor PostgreSQL
 */
export async function getDateFromServer(): Promise<Date> {
  const result = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
  return result[0].now;
}
