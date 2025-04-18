import { NextRequest } from 'next/server';

// Sobrescribe los tipos de Next.js para corregir el problema de params
declare module 'next/dist/server/web/exports/next-request' {
  interface NextRequest {
    params?: Record<string, string>;
  }
}

// Sobrescribe el tipo de parámetros para las rutas de API
declare module 'next' {
  interface RequestHandler {
    (req: NextRequest, context: { params: Record<string, string> }): Promise<Response>;
  }
}
