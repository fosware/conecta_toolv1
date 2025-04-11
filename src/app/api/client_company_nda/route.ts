import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// GET: Obtener todos los NDAs con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el usuario y su rol
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Parámetros de búsqueda
    const searchQuery = request.nextUrl.searchParams.get("search") || "";
    const showOnlyValid = request.nextUrl.searchParams.get("showOnlyValid") === "true";

    // Construir la condición where base
    let whereCondition: Prisma.ClientCompanyNDAWhereInput = {};

    // Filtrar por NDAs vigentes si se solicita
    if (showOnlyValid) {
      // Obtener la fecha actual (hoy)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Establecer a inicio del día para comparación correcta
      
      // En el modelo, ndaExpirationDate es obligatorio (no puede ser null)
      whereCondition.ndaExpirationDate = {
        gte: today
      };
    }

    // Siempre excluir los registros eliminados
    whereCondition.isDeleted = false;

    // Añadir condición de búsqueda si existe
    if (searchQuery) {
      whereCondition.OR = [
        {
          Client: {
            name: { contains: searchQuery, mode: 'insensitive' }
          }
        },
        {
          Company: {
            companyName: { contains: searchQuery, mode: 'insensitive' }
          }
        }
      ];
    }

    // Obtener NDAs con sus relaciones
    const ndas = await prisma.clientCompanyNDA.findMany({
      where: whereCondition,
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transformar datos para la respuesta
    const formattedNDAs = ndas.map((nda) => ({
      id: nda.id,
      clientId: nda.clientId,
      clientName: nda.Client.name,
      companyId: nda.companyId,
      companyName: nda.Company.companyName,
      ndaSignedFileName: nda.ndaSignedFileName,
      ndaExpirationDate: nda.ndaExpirationDate?.toISOString() || null,
      createdAt: nda.createdAt.toISOString(),
      updatedAt: nda.updatedAt.toISOString(),
      isActive: nda.isActive,
    }));

    return NextResponse.json({
      success: true,
      data: formattedNDAs,
    });
  } catch (error) {
    console.error("[CLIENT_COMPANY_NDA_GET]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al cargar NDAs" 
      },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo NDA
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const clientId = parseInt(formData.get("clientId") as string);
    const companyId = parseInt(formData.get("companyId") as string);
    const expirationDateStr = formData.get("expirationDate") as string;
    const ndaFile = formData.get("ndaFile");

    // Validar datos
    if (!clientId || !companyId || !ndaFile || !expirationDateStr) {
      return NextResponse.json(
        { 
          success: false,
          error: "Faltan datos requeridos" 
        },
        { status: 400 }
      );
    }
    
    // Verificar si ya existe un NDA activo para esta combinación de cliente y asociado
    const existingNDA = await prisma.clientCompanyNDA.findFirst({
      where: {
        clientId,
        companyId,
        isActive: true
      }
    });
    
    if (existingNDA) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe un NDA activo para este cliente y asociado"
        },
        { status: 409 } // Conflict status code
      );
    }

    // Procesar el archivo
    let ndaFileName = null;
    let ndaFileData = null;

    if (
      ndaFile &&
      typeof ndaFile === "object" &&
      "arrayBuffer" in ndaFile &&
      typeof ndaFile.arrayBuffer === "function"
    ) {
      const bytes = await ndaFile.arrayBuffer();
      ndaFileData = Buffer.from(bytes);
      ndaFileName = "name" in ndaFile ? (ndaFile.name as string) : null;
    }

    if (!ndaFileName || !ndaFileData) {
      return NextResponse.json(
        { 
          success: false,
          error: "Error al procesar el archivo" 
        },
        { status: 400 }
      );
    }

    // Crear la fecha de expiración a partir de los componentes de la fecha
    const [year, month, day] = expirationDateStr.split('-').map(Number);
    // Crear una fecha simple sin preocuparse por la zona horaria
    const expirationDate = new Date(year, month - 1, day);

    // Crear el NDA en la base de datos
    const newNDA = await prisma.clientCompanyNDA.create({
      data: {
        clientId,
        companyId,
        ndaSignedFileName: ndaFileName,
        ndaSignedFile: ndaFileData,
        ndaExpirationDate: expirationDate,
        isActive: true,
        userId: userId
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: newNDA.id },
      message: "NDA creado correctamente",
    }, { status: 201 });
  } catch (error) {
    console.error("[CLIENT_COMPANY_NDA_POST]", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error al crear el NDA" 
      },
      { status: 500 }
    );
  }
}
