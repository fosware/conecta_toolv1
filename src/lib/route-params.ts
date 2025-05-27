/**
 * Utilidad para manejar los parámetros de ruta en Next.js 13+
 * Soluciona el problema con los parámetros dinámicos en rutas API
 */

/**
 * Función simple para extraer el ID de los parámetros de ruta de forma segura
 * @param params Objeto de parámetros de ruta o ID directamente
 * @returns El ID como string
 */
export function extractRouteId(params: any): string {
  // Si params es un string, devolverlo directamente
  if (typeof params === 'string') {
    return params;
  }
  
  // Si params es una promesa, no intentar acceder a sus propiedades
  // El llamante debe usar await antes de pasar params a esta función
  if (params && typeof params === 'object' && typeof params.then === 'function') {
    throw new Error('params debe ser esperado (await) antes de usar extractRouteId');
  }
  
  // Si params tiene una propiedad id, devolverla
  if (params && typeof params === 'object' && 'id' in params) {
    return String(params.id);
  }
  
  // Si params es un objeto con params.params.id
  if (params && typeof params === 'object' && params.params && typeof params.params === 'object' && 'id' in params.params) {
    return String(params.params.id);
  }
  
  // Fallback
  return '';
}

/**
 * Función para manejar los parámetros de ruta en Next.js 13+
 * @param params Objeto de parámetros de ruta (debe ser esperado con await)
 * @returns Objeto con los parámetros de ruta como strings
 */
export async function handleRouteParams<T extends Record<string, any>>(params: T): Promise<Record<string, string>> {
  // Crear un objeto para almacenar todos los parámetros
  const result: Record<string, string> = {};
  
  // Asegurarse de que params sea un objeto y no una promesa
  const resolvedParams = await params;
  
  // Copiar todas las propiedades del objeto params
  if (resolvedParams && typeof resolvedParams === 'object') {
    for (const key in resolvedParams) {
      if (Object.prototype.hasOwnProperty.call(resolvedParams, key)) {
        result[key] = String(resolvedParams[key]);
      }
    }
  }
  
  return result;
}
