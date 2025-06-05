/**
 * Utilidades para el manejo de fechas en la zona horaria de México
 */

// Constante para el offset de la zona horaria de México (UTC-6)
// Puede variar entre -6 y -5 dependiendo del horario de verano
const MEXICO_CITY_OFFSET_HOURS = -6;

/**
 * Obtiene la fecha y hora actual en la zona horaria de América/Mexico_City
 * @returns Un objeto Date con la fecha y hora actual en la zona horaria de México
 */
export function getCurrentDateInMexicoCity(): Date {
  // Obtener la fecha y hora actual en UTC
  const now = new Date();
  
  // Crear una fecha en formato ISO con el offset de Ciudad de México
  const mexicoCityDateString = new Date().toLocaleString("en-US", {
    timeZone: "America/Mexico_City"
  });
  
  // Convertir la cadena de fecha a un objeto Date
  const mexicoCityDate = new Date(mexicoCityDateString);
  
  return mexicoCityDate;
}

/**
 * Crea una fecha para guardar en la base de datos que represente correctamente
 * la hora en la zona horaria de México cuando se recupere.
 * 
 * Esta función compensa el hecho de que PostgreSQL/Prisma convierte las fechas a UTC
 * al guardarlas, lo que puede causar que una fecha creada en la zona horaria local
 * se guarde con un offset incorrecto.
 * 
 * @param date Fecha a ajustar (opcional, por defecto usa la fecha actual)
 * @returns Una fecha ajustada que, cuando se guarde en la base de datos, representará correctamente la hora de México
 */
export function createDateForDatabaseInMexicoTime(date?: Date): Date {
  // Usar la fecha proporcionada o la fecha actual
  const baseDate = date || new Date();
  
  // Obtener la fecha en formato de México
  const mexicoCityDate = new Date(baseDate.toLocaleString("en-US", {
    timeZone: "America/Mexico_City"
  }));
  
  // Crear una nueva fecha que represente la hora de México en UTC
  // Para que cuando PostgreSQL la guarde, se mantenga la hora correcta
  const adjustedDate = new Date(Date.UTC(
    mexicoCityDate.getFullYear(),
    mexicoCityDate.getMonth(),
    mexicoCityDate.getDate(),
    mexicoCityDate.getHours(),
    mexicoCityDate.getMinutes(),
    mexicoCityDate.getSeconds(),
    mexicoCityDate.getMilliseconds()
  ));
  
  return adjustedDate;
}

/**
 * Formatea una fecha para mostrarla en el formato de México (DD/MM/YYYY, HH:MM)
 * @param dateString La fecha a formatear (string o Date)
 * @returns La fecha formateada como string
 */
export function formatDateForMexicoDisplay(dateString: string | Date | undefined): string {
  if (!dateString) return "Fecha no disponible";

  try {
    // Crear la fecha y verificar si es válida
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    
    // Ajustar manualmente la fecha para corregir el problema de zona horaria
    // Si la fecha en frontend muestra 04/06/2025, 19:23 cuando debería ser 05/06/2025, 01:24
    // entonces hay un desfase de +6 horas (no -6)
    const mexicoDate = new Date(date);
    mexicoDate.setHours(mexicoDate.getHours() + 6);
    
    // Formatear la fecha ajustada
    const day = mexicoDate.getDate().toString().padStart(2, '0');
    const month = (mexicoDate.getMonth() + 1).toString().padStart(2, '0');
    const year = mexicoDate.getFullYear();
    const hours = mexicoDate.getHours().toString().padStart(2, '0');
    const minutes = mexicoDate.getMinutes().toString().padStart(2, '0');
    
    // Formato: DD/MM/YYYY, HH:MM
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "Error al formatear fecha";
  }
}

/**
 * Compara dos fechas para determinar si están dentro de un rango de tiempo específico
 * @param date1 Primera fecha a comparar
 * @param date2 Segunda fecha a comparar
 * @param rangeInMs Rango en milisegundos (por defecto 10 segundos)
 * @returns true si las fechas están dentro del rango especificado
 */
export function areDatesWithinRange(date1: Date, date2: Date, rangeInMs: number = 10000): boolean {
  const time1 = date1.getTime();
  const time2 = date2.getTime();
  
  return Math.abs(time1 - time2) <= rangeInMs;
}
