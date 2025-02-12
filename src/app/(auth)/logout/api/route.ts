import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set("token", "", { path: "/", maxAge: 0 }); // Elimina el token
  
  // Agregar headers CORS
  response.headers.set("Access-Control-Allow-Origin", req.headers.get("origin") || "*");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  return response;
}

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set("token", "", { path: "/", maxAge: 0 }); // Elimina el token
  
  // Agregar headers CORS
  response.headers.set("Access-Control-Allow-Origin", req.headers.get("origin") || "*");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  return response;
}

// Manejar preflight OPTIONS request
export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  
  // Agregar headers CORS
  response.headers.set("Access-Control-Allow-Origin", req.headers.get("origin") || "*");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  return response;
}
