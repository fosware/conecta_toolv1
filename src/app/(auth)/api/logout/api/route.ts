import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Sesión cerrada correctamente",
  });

  // Eliminar la cookie del token
  response.cookies.set("token", "", { maxAge: 0 });
  return response;
}
