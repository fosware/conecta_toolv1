import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

// Tipo personalizado para el contenido del token
type DecodedToken = {
  userId: number;
  roles: string[];
};

export function middleware(req: NextRequest) {
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/auth/api/login",
    "/auth/api/register",
  ];
  const protectedRoutes = [
    "/dashboard",
    "/modules/proyectos",
    "/modules/asociados",
    "/modules/clientes",
    "/modules/especialidades",
    "/modules/certificaciones",
  ];

  const { pathname } = req.nextUrl;

  // Permitir acceso a rutas públicas sin verificación
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar si la ruta es protegida
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // Extraer el valor del token de la cookie
    const token = req.cookies.get("token")?.value;

    if (!token) {
      // Redirigir al login si no hay token
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    try {
      // Verificar el token y forzar el tipo a DecodedToken
      const decoded = jwt.verify(token, JWT_SECRET) as unknown as DecodedToken;

      // Ejemplo de restricción por rol
      if (
        pathname.startsWith("/modules/proyectos") &&
        !decoded.roles.includes("admin")
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      return NextResponse.next(); // Token válido, permitir acceso
    } catch (error) {
      console.error("Error verificando token:", error);
      return NextResponse.redirect(new URL("/auth/login", req.url)); // Token inválido, redirigir al login
    }
  }

  // Permitir acceso a cualquier otra ruta no protegida
  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"], // Aplicar middleware a todas las rutas
};
