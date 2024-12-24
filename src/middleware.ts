import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(req: NextRequest) {
  const publicRoutes = ["/login", "/api/login"];
  const protectedRoutes = [
    "/profile",
    "/dashboard",
    "/proyectos",
    "/asociados",
    "/clientes",
    "/especialidades",
    "/certificaciones",
    "/profile",
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
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }

    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      if (!payload.userId) {
        console.error("El token no contiene userId");
        return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
      }

      // Adjunta el userId al encabezado para uso en las APIs.
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("user-id", String(payload.userId));
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error("Error verificando token:", error);
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }
  }

  // Permitir acceso a cualquier otra ruta no protegida
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.css|.*\\.js|.*\\.map).*)",
  ],
};
