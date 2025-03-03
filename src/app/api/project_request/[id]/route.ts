import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { projectRequestFormSchema } from "@/lib/schemas/project-request";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Obtener el usuario
    const userId = await getUserFromToken();
    console.log("UserId:", userId);
    
    if (!userId) {
      return NextResponse.json(
        { message: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Obtener y validar el ID
    const { id } = await params;
    const parsedId = parseInt(id);
    console.log("ParsedId:", parsedId);
    
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { message: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const existingRequest = await prisma.projectRequest.findUnique({
      where: { id: parsedId },
      include: {
        details: {
          include: {
            certifications: true,
            specialties: true
          }
        }
      }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { message: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Obtener y validar el body
    const rawBody = await request.text();
    console.log("Raw body:", rawBody);
    
    if (!rawBody) {
      return NextResponse.json(
        { message: "El cuerpo de la solicitud está vacío" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = JSON.parse(rawBody);
      console.log("Parsed body:", body);
    } catch (e) {
      console.error("Error parsing body:", e);
      return NextResponse.json(
        { message: "Error al parsear el cuerpo de la solicitud" },
        { status: 400 }
      );
    }

    const validationResult = projectRequestFormSchema.safeParse(body);
    console.log("Validation result:", validationResult);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Error de validación", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    console.log("Validated data:", validatedData);

    // Actualizar la solicitud principal
    const updatedRequest = await prisma.projectRequest.update({
      where: { id: parsedId },
      data: {
        title: validatedData.title,
        clientAreaId: validatedData.clientAreaId,
        userId,
        isDeleted: false,
        dateDeleted: null,
      },
    });

    console.log("Updated request:", updatedRequest);

    // Eliminar las relaciones antiguas y los detalles en orden
    for (const detail of existingRequest.details) {
      // Primero eliminar las certificaciones
      if (detail.certifications.length > 0) {
        await prisma.requirementCertification.deleteMany({
          where: { projectDetailsId: detail.id }
        });
      }

      // Luego eliminar las especialidades
      if (detail.specialties.length > 0) {
        await prisma.requirementSpecialty.deleteMany({
          where: { projectDetailsId: detail.id }
        });
      }
    }

    // Ahora sí podemos eliminar los detalles
    await prisma.projectRequestDetails.deleteMany({
      where: { projectRequestId: parsedId }
    });

    // Crear los nuevos detalles
    const updatedDetails = [];
    
    for (const detail of validatedData.details) {
      // Crear el detalle base
      const newDetail = await prisma.projectRequestDetails.create({
        data: {
          projectRequestId: parsedId,
          name: detail.name,
          userId,
        },
      });

      console.log("Created detail:", newDetail);

      // Conectar certificaciones si existen
      if (Array.isArray(detail.certifications) && detail.certifications.length > 0) {
        for (const certId of detail.certifications) {
          await prisma.requirementCertification.create({
            data: {
              projectDetailsId: newDetail.id,
              certificationId: certId,
              userId,
            },
          });
        }
      }

      // Conectar especialidades si existen
      if (Array.isArray(detail.specialties) && detail.specialties.length > 0) {
        for (const specId of detail.specialties) {
          await prisma.requirementSpecialty.create({
            data: {
              projectDetailsId: newDetail.id,
              specialtyId: specId,
              scopeId: detail.scopeId || null,
              subscopeId: detail.subscopeId || null,
              userId,
            },
          });
        }
      }

      updatedDetails.push(newDetail);
    }

    return NextResponse.json({ 
      data: {
        ...updatedRequest,
        details: updatedDetails
      },
      message: "Solicitud de proyecto actualizada correctamente"
    });

  } catch (error: any) {
    const errorMessage = error?.message || "Error al actualizar la solicitud de proyecto";
    const errorDetails = error?.stack || "";
    
    console.error("Error al actualizar la solicitud de proyecto:", errorMessage);
    if (errorDetails) {
      console.error("Stack trace:", errorDetails);
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

// GET: Obtener una solicitud de proyecto por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Obtener el usuario desde el token con manejo de errores mejorado
    const userId = await getUserFromToken().catch(error => {
      console.error("Error al obtener el usuario desde el token:", error);
      return null;
    });

    if (!userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    console.log("Usuario autenticado en GET [id]:", userId);

    // Asegurarse de que params se trate como una promesa
    const { id } = await params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { message: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    console.log(`Buscando solicitud de proyecto con ID: ${parsedId}`);

    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id: parsedId },
      include: {
        clientArea: {
          include: {
            client: true,
          },
        },
        details: {
          include: {
            certifications: true,
            specialties: true,
          },
        },
      },
    });

    if (!projectRequest) {
      console.log(`Solicitud de proyecto con ID ${parsedId} no encontrada`);
      return NextResponse.json(
        { message: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    console.log(`Solicitud de proyecto con ID ${parsedId} encontrada`);

    // Formatear la respuesta para que sea compatible con el frontend
    const formattedResponse = {
      ...projectRequest,
      details: projectRequest.details.map((detail) => ({
        ...detail,
        certifications: detail.certifications.map((cert) => cert.certificationId),
        specialties: detail.specialties.map((spec) => spec.specialtyId),
      }))
    };

    console.log("Formato de respuesta enviado:", {
      id: formattedResponse.id,
      title: formattedResponse.title,
      detailsCount: formattedResponse.details.length,
      sampleDetail: formattedResponse.details.length > 0 ? {
        id: formattedResponse.details[0].id,
        name: formattedResponse.details[0].name,
        certCount: formattedResponse.details[0].certifications.length,
        specCount: formattedResponse.details[0].specialties.length
      } : null
    });

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Error al obtener la solicitud de proyecto:", error);
    return new Response(
      JSON.stringify({ message: "Error al obtener la solicitud de proyecto" }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
