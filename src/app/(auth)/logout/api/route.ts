import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL("/login", req.url); // Genera la URL absoluta

  const response = NextResponse.redirect(url);
  response.cookies.set("token", "", { path: "/", maxAge: 0 }); // Elimina el token
  return response;
}

export async function POST(req: NextRequest) {
  const url = new URL("/login", req.url); // Genera la URL absoluta

  const response = NextResponse.redirect(url);
  response.cookies.set("token", "", { path: "/", maxAge: 0 }); // Elimina el token
  return response;
}
