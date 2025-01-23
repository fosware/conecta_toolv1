import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Rutas que no requieren autenticación
const publicRoutes = ["/login", "/api/login"];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Si no hay token, redirigir inmediatamente
  if (!token) {
    // Para APIs retornar 401 con respuesta JSON
    if (pathname.includes("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "No autorizado" }),
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
    }
    // Para rutas normales, redirigir a login sin mensaje
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verificar token solo si existe JWT_SECRET
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET no definido");
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    // Si el token está expirado, tratar como no autenticado
    const exp = payload.exp as number;
    if (exp && Date.now() >= exp * 1000) {
      if (pathname.includes("/api/")) {
        return new NextResponse(
          JSON.stringify({ error: "Token expirado" }),
          { 
            status: 401,
            headers: {
              "Content-Type": "application/json",
            }
          }
        );
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Clonar la petición y agregar el token como header de autorización
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("authorization", `Bearer ${token}`);

    // Continuar con la petición modificada
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  } catch (error) {
    console.error("Error al verificar token:", error);

    if (pathname.includes("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Token inválido" }),
        { 
          status: 401,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico)$).*)",
  ],
};
