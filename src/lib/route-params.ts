/**
 * Utilidad para manejar los parámetros de ruta en Next.js 15
 * Soluciona el problema de TypeScript con los parámetros dinámicos en rutas API
 */

/**
 * Convierte un objeto de parámetros de ruta a un formato compatible con Next.js 15
 * @param params Objeto de parámetros de ruta
 * @returns El mismo objeto de parámetros, pero compatible con TypeScript
 */
export function handleRouteParams<T extends Record<string, string>>(params: T): T {
  return params;
}
