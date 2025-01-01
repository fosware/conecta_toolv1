import { NextRequest, NextResponse } from "next/server";
import { menuItems } from "@/lib/menu";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET no está definido");
      return NextResponse.json(
        { message: "Error interno del servidor" },
        { status: 500 }
      );
    }

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const role = req.headers.get("role");

    if (!token) {
      return NextResponse.json(
        { message: "Autenticación requerida" },
        { status: 401 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { message: "Rol no especificado en los encabezados" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    const userRole = role || payload.role;
    console.log("Role del usuario procesado:", userRole);

    let responseMenu = [...menuItems];
    if (userRole !== "Admin") {
      responseMenu = responseMenu.filter(
        (item) => item.name !== "Administración"
      );
    }

    return NextResponse.json(responseMenu);
  } catch (error) {
    console.error("Error al procesar el menú:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
