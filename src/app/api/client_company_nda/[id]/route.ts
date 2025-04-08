import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";

// GET: Obtener un NDA específico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const ndaId = parseInt(id);

    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar el NDA por ID
    const nda = await prisma.clientCompanyNDA.findUnique({
      where: { id: ndaId },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
          },
        },
        Company: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!nda) {
      return NextResponse.json(
        { 
          success: false,
          error: "NDA no encontrado" 
        },
        { status: 404 }
      );
    }

    // Transformar datos para la respuesta (sin incluir los datos binarios del archivo)
    const formattedNDA = {
      id: nda.id,
      clientId: nda.clientId,
      clientName: nda.Client.name,
      companyId: nda.companyId,
      companyName: nda.Company.companyName,
      ndaFileName: nda.ndaFileName,
      ndaDateUploaded: nda.ndaDateUploaded?.toISOString() || null,
      ndaSignedFileName: nda.ndaSignedFileName,
      ndaSignedAt: nda.ndaSignedAt?.toISOString() || null,
      ndaExpirationDate: nda.ndaExpirationDate?.toISOString() || null,
      isActive: nda.isActive,
    };

    return NextResponse.json({
      success: true,
      data: formattedNDA,
    });
  } catch (error) {
    console.error("[CLIENT_COMPANY_NDA_GET_BY_ID]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener el NDA" 
      },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un NDA existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const ndaId = parseInt(id);

    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el NDA existe
    const existingNDA = await prisma.clientCompanyNDA.findUnique({
      where: { id: ndaId },
    });

    if (!existingNDA) {
      return NextResponse.json(
        { 
          success: false,
          error: "NDA no encontrado" 
        },
        { status: 404 }
      );
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const clientId = parseInt(formData.get("clientId") as string);
    const companyId = parseInt(formData.get("companyId") as string);
    const expirationDateStr = formData.get("expirationDate") as string;
    const ndaFile = formData.get("ndaFile");

    // Validar datos
    if (!clientId || !companyId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Faltan datos requeridos" 
        },
        { status: 400 }
      );
    }
    
    // Verificar si ya existe otro NDA activo para esta combinación de cliente y asociado
    const existingConflictNDA = await prisma.clientCompanyNDA.findFirst({
      where: {
        clientId,
        companyId,
        isActive: true,
        id: { not: ndaId } // Excluir el NDA actual
      }
    });
    
    if (existingConflictNDA) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe un NDA activo para este cliente y asociado"
        },
        { status: 409 } // Conflict status code
      );
    }

    // Preparar datos para actualización
    const updateData: any = {
      clientId,
      companyId,
      // Crear la fecha de expiración a partir de los componentes de la fecha para evitar problemas con zonas horarias
      ndaExpirationDate: expirationDateStr ? (() => {
        const [year, month, day] = expirationDateStr.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
      })() : null,
    };

    // Si se proporciona un nuevo archivo, procesarlo
    if (ndaFile && 
        typeof ndaFile === "object" &&
        "arrayBuffer" in ndaFile &&
        typeof ndaFile.arrayBuffer === "function") {
      const bytes = await ndaFile.arrayBuffer();
      updateData.ndaFile = Buffer.from(bytes);
      updateData.ndaFileName = "name" in ndaFile ? (ndaFile.name as string) : null;
      updateData.ndaDateUploaded = new Date();
    }

    // Actualizar el NDA en la base de datos
    const updatedNDA = await prisma.clientCompanyNDA.update({
      where: { id: ndaId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: { id: updatedNDA.id },
      message: "NDA actualizado correctamente",
    });
  } catch (error) {
    console.error("[CLIENT_COMPANY_NDA_UPDATE]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al actualizar el NDA" 
      },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un NDA
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extraer el ID correctamente
    const { id } = await params;
    const ndaId = parseInt(id);

    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el NDA existe
    const existingNDA = await prisma.clientCompanyNDA.findUnique({
      where: { id: ndaId },
    });

    if (!existingNDA) {
      return NextResponse.json(
        { 
          success: false,
          error: "NDA no encontrado" 
        },
        { status: 404 }
      );
    }

    // Eliminar el NDA (soft delete)
    await prisma.clientCompanyNDA.update({
      where: { id: ndaId },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "NDA eliminado correctamente",
    });
  } catch (error) {
    console.error("[CLIENT_COMPANY_NDA_DELETE]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al eliminar el NDA" 
      },
      { status: 500 }
    );
  }
}
