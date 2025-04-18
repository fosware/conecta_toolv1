import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleRouteParams } from "@/lib/route-params";

interface Certificacion {
  certificacion: string;
  fecha_vencimiento: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID de empresa inválido" },
        { status: 400 }
      );
    }

    const profiles = await prisma.$queryRaw`
      SELECT * FROM v_companies_overview WHERE id = ${companyId}
    `;

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    const profile = profiles[0];

    return NextResponse.json({
      id: profile.id,
      nombre_comercial: profile.nombre_comercial,
      razon_social: profile.razon_social,
      logros: profile.logros,
      semblanza: profile.semblanza,
      contato_ventas: profile.contato_ventas,
      maquinas_principales: profile.maquinas_principales,
      total_empleados: profile.total_empleados,
      telefono: profile.telefono,
      correo: profile.correo,
      liga_semblanza: profile.liga_semblanza,
      sitio_web: profile.sitio_web,
      certificaciones: profile.certificaciones || [],
      especialidades: profile.especialidades || [],
      logo_empresa: profile.logo_empresa || null,
    });
  } catch (error) {
    console.error("Error loading company profile:", error);
    return NextResponse.json(
      { error: "Error al cargar el perfil" },
      { status: 500 }
    );
  }
}
