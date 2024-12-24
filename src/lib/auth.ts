import jwt from "jsonwebtoken";

type TokenPayload = {
  id: number;
  roles: string[];
};

export function getToken(token: string): TokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET || "default_secret";
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return null;
  }
}
