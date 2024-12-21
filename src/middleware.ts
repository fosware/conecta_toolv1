import { NextRequest, NextResponse } from "next/server";
//import * as jose from "jose";

// Tipo personalizado para el contenido del token
/*
type DecodedToken = {
  userId: number;
  roles: string[];
};
*/
const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(req: NextRequest) {
  const publicRoutes = ["/login", "/api/login"];
  const protectedRoutes = [
    "/",
    "/dashboard",
    "/proyectos",
    "/asociados",
    "/clientes",
    "/especialidades",
    "/certificaciones",
    "/register",
    "/api/register",
  ];

  const { pathname } = req.nextUrl;

  // Permitir acceso a rutas públicas sin verificación
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar si la ruta es protegida
  if (
    protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route)
    )
  ) {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      // Redirigir al login si no hay token
      const loginUrl = new URL("/login", req.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      const loginUrl = new URL("/login", req.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verificar el token y forzar el tipo a DecodedToken

      // Ejemplo de restricción por rol
      /*
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      const decoded = payload as unknown as DecodedToken;
      if (
        pathname.startsWith("/proyectos") &&
        !decoded.roles.includes("admin")
      ) {
        const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
        return NextResponse.redirect(dashboardUrl);
      }
      */
      return NextResponse.next(); // Token válido, permitir acceso
    } catch (error) {
      console.error("Error verificando token:", error);
      const loginUrl = new URL("/login", req.nextUrl.origin);
      return NextResponse.redirect(loginUrl); // Token inválido, redirigir al login
    }
  }

  // Permitir acceso a cualquier otra ruta no protegida
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.css|.*\\.js|.*\\.map).*)",
  ],
};
