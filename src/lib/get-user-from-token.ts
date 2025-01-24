import { headers } from "next/headers";
import { jwtVerify } from "jose";

interface JWTPayload {
  userId: number;
  role: string;
  iat?: number;
  exp?: number;
}

export async function getUserFromToken(): Promise<number> {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error("No autorizado: Header de autorización inválido");
    }

    const token = authHeader.split(" ")[1];
    if (!token || !process.env.JWT_SECRET) {
      throw new Error("No autorizado: Token no encontrado");
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const verifyResult = await jwtVerify(token, secret);
      
      if (!verifyResult.payload || typeof verifyResult.payload !== 'object') {
        throw new Error("Payload del token inválido");
      }

      const jwtPayload = verifyResult.payload as JWTPayload;

      if (!jwtPayload.userId || typeof jwtPayload.userId !== 'number') {
        throw new Error("UserId no encontrado en el token");
      }

      return jwtPayload.userId;
    } catch (verifyError) {
      console.error("Error al verificar el token:", verifyError);
      throw new Error("Token inválido o expirado");
    }
  } catch (error) {
    console.error("Error en getUserFromToken:", error);
    throw new Error(error instanceof Error ? error.message : "Error de autorización");
  }
}
