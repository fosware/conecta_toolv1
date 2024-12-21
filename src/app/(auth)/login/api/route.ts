import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { message: "Token no encontrado" },
        { status: 401 }
      );
    }

    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    // Respuesta en caso de éxito
    return NextResponse.json(
      { message: "Acceso permitido", user: decoded },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verificando token:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Manejar solicitudes POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Simulación de validación de usuario
    if (email === "user@example.com" && password === "password123") {
      // Generar token JWT
      const token = jwt.sign(
        { email, role: "user" },
        JWT_SECRET,
        { expiresIn: "1h" } // Expira en 1 hora
      );

      return NextResponse.json({ token }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Credenciales incorrectas" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Error en la autenticación:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
