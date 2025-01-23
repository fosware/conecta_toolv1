import { headers } from "next/headers";
import { jwtVerify } from "jose";

interface JWTPayload {
  userId: number;
  role: string;
  iat?: number;
  exp?: number;
}

export async function getUserFromToken(): Promise<number> {
  const headersList = headers();
  const token = headersList.get("authorization")?.split(" ")[1];

  if (!token || !process.env.JWT_SECRET) {
    throw new Error("No autorizado");
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const jwtPayload = payload as JWTPayload;

    if (!jwtPayload.userId) {
      throw new Error("Token inválido");
    }

    return jwtPayload.userId;
  } catch (error) {
    throw new Error("No autorizado");
  }
}
