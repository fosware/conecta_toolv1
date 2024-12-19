import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // Devuelve una lista de proyectos
  return NextResponse.json([
    { id: 1, nombre: "Proyecto A" },
    { id: 2, nombre: "Proyecto B" },
  ]);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  // Lógica para crear un nuevo proyecto
  return NextResponse.json({ message: "Proyecto creado con éxito", data });
}
