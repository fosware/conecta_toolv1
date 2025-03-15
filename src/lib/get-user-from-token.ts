import { headers } from "next/headers";
import { jwtVerify } from "jose";

interface JWTPayload {
  userId: number; // Cambiado de id a userId para coincidir con el token real
  role?: string;
  iat?: number;
  exp?: number;
}

export async function getUserFromToken(): Promise<number> {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      console.log(
        "No se encontró el header de autorización o no tiene el formato correcto"
      );
      throw new Error("No autorizado: Header de autorización inválido");
    }

    const token = authHeader.split(" ")[1];
    if (!token || !process.env.JWT_SECRET) {
      console.log("Token no encontrado o JWT_SECRET no definido");
      throw new Error("No autorizado: Token no encontrado");
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);

      const verifyResult = await jwtVerify(token, secret);

      if (!verifyResult.payload || typeof verifyResult.payload !== "object") {
        console.log("Payload del token inválido:", verifyResult.payload);
        throw new Error("Payload del token inválido");
      }

      // Convertir a unknown primero para evitar error de TypeScript
      const payload = verifyResult.payload as unknown;
      const jwtPayload = payload as JWTPayload;

      if (!jwtPayload.userId || typeof jwtPayload.userId !== "number") {
        // console.log("UserId no encontrado en el token. Payload:", jwtPayload);
        throw new Error("UserId no encontrado en el token");
      }

      //console.log("ID de usuario encontrado:", jwtPayload.userId);
      return jwtPayload.userId;
    } catch (verifyError) {
      console.error("Error al verificar el token:", verifyError);
      throw new Error("Token inválido o expirado");
    }
  } catch (error) {
    console.error("Error en getUserFromToken:", error);
    throw new Error(
      error instanceof Error ? error.message : "Error de autorización"
    );
  }
}
