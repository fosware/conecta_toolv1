import { NextResponse } from "next/server";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1];

    if (!token || !JWT_SECRET) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload.userId) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    // Verificar expiración del token
    const exp = payload.exp;
    if (exp && Date.now() >= exp * 1000) {
      return NextResponse.json({ message: "Token expirado" }, { status: 401 });
    }

    return NextResponse.json({ 
      message: "Autenticado",
      user: {
        userId: payload.userId,
        role: payload.role
      }
    });
  } catch (error) {
    console.error("Error verificando token:", error);
    return NextResponse.json({ message: "Error de autenticación" }, { status: 401 });
  }
}
