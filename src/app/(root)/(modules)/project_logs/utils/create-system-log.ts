import { getToken } from "@/lib/auth";
import { getCurrentDateInMexicoCity, createDateForDatabaseInMexicoTime } from "@/lib/date-utils";

/**
 * Crea un log automático del sistema para un proyecto
 * @param projectId ID del proyecto
 * @param message Mensaje a registrar (sin el prefijo [SISTEMA])
 * @param categoryId ID de la categoría (opcional)
 * @returns Promise con el resultado de la operación
 */
export async function createSystemLog(
  projectId: number,
  message: string,
  categoryId?: number
): Promise<boolean> {
  try {
    const token = getToken();
    if (!token) {
      console.error("No se pudo obtener el token para crear log del sistema");
      return false;
    }

    // Formatear el mensaje con el prefijo de sistema
    const systemMessage = `[SISTEMA] ${message}`;

    // No enviamos fecha desde el frontend
    // El backend obtendrá la fecha actual directamente de PostgreSQL en la zona horaria correcta
    const body: Record<string, any> = {
      projectId,
      message: systemMessage,
      // No incluimos dateTimeMessage para que el backend use la fecha actual de PostgreSQL
    };

    // Agregar categoryId si está presente
    if (categoryId) {
      body.categoryId = categoryId;
    }

    // Enviar la solicitud para crear el log
    const response = await fetch("/api/projects/logs/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("Error al crear log del sistema:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error al crear log del sistema:", error);
    return false;
  }
}
