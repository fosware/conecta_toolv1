import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(req: NextRequest) {
  const publicRoutes = ["/login", "/api/login"];
  const { pathname } = req.nextUrl;

  console.log("Middleware ejecutado para:", pathname);

  // Permitir acceso a rutas públicas
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    console.error("Token no encontrado, redirigiendo a /login");
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (!JWT_SECRET) {
    console.error("JWT_SECRET no está definido");
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload.userId) {
      console.error("El token no contiene userId");
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }

    console.log("Headers antes del set:", Object.fromEntries(req.headers));

    // Adjuntar encabezados para el uso en las APIs
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("user-id", String(payload.userId));
    requestHeaders.set("Authorization", `Bearer ${token}`);
    requestHeaders.set("role", String(payload.role)); // Adjuntar el rol del usuario

    console.log(
      "Encabezados enviados al API:",
      Object.fromEntries(requestHeaders)
    );

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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.css|.*\\.js|.*\\.map).*)",
  ],
};
