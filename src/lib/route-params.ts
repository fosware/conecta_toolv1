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
 * Mantener esta función por compatibilidad con el código existente
 * @deprecated Usar extractRouteId en su lugar
 */
export function handleRouteParams<T extends Record<string, any>>(params: T): Record<string, string> {
  return { id: extractRouteId(params) };
}
