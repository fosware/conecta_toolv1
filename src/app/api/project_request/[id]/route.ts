import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("Usuario autenticado en GET [id]:", userId);

    // Asegurarse de que params se trate como una promesa
    const { id } = await params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
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
        { error: "Solicitud de proyecto no encontrada" },
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
    return NextResponse.json(
      { message: "Error al obtener la solicitud de proyecto", error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

// PUT: Actualizar una solicitud de proyecto
export async function PUT(
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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("Usuario autenticado en PUT [id]:", userId);

    // Asegurarse de que params se trate como una promesa
    const { id } = await params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "ID de solicitud inválido" },
        { status: 400 }
      );
    }

    console.log(`Actualizando solicitud de proyecto con ID: ${parsedId}`);

    const body = await req.json();
    console.log("Datos recibidos para actualización:", JSON.stringify(body, null, 2));

    // Verificar si la solicitud existe
    const existingRequest = await prisma.projectRequest.findUnique({
      where: { id: parsedId },
      include: {
        details: {
          include: {
            certifications: true,
            specialties: true,
          }
        },
      },
    });

    if (!existingRequest) {
      console.log(`Solicitud de proyecto con ID ${parsedId} no encontrada para actualizar`);
      return NextResponse.json(
        { error: "Solicitud de proyecto no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar la solicitud principal
    const updatedRequest = await prisma.projectRequest.update({
      where: { id: parsedId },
      data: {
        title: body.title,
        clientAreaId: body.clientAreaId,
        updatedAt: new Date(),
      },
    });

    console.log(`Solicitud principal actualizada: ${updatedRequest.id}`);

    // Eliminar todos los detalles existentes
    await prisma.projectRequestDetails.deleteMany({
      where: { projectRequestId: parsedId },
    });

    console.log(`Detalles antiguos eliminados para la solicitud ${parsedId}`);

    // Crear los nuevos detalles
    for (const detail of body.details) {
      const newDetail = await prisma.projectRequestDetails.create({
        data: {
          projectRequestId: parsedId,
          name: detail.name,
          userId,
        },
      });

      console.log(`Nuevo detalle creado: ${newDetail.id}`);

      // Conectar certificaciones
      if (detail.certifications && detail.certifications.length > 0) {
        for (const certId of detail.certifications) {
          await prisma.requirementCertification.create({
            data: {
              projectDetailsId: newDetail.id,
              certificationId: certId,
              userId,
            },
          });
        }
        console.log(`Certificaciones conectadas para el detalle ${newDetail.id}`);
      }

      // Conectar especialidades y opcionalmente alcances/subalcances
      if (detail.specialties && detail.specialties.length > 0) {
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
        console.log(`Especialidades conectadas para el detalle ${newDetail.id}`);
      }
    }

    console.log(`Solicitud de proyecto ${parsedId} actualizada completamente`);

    return NextResponse.json({
      message: "Solicitud de proyecto actualizada correctamente",
      id: updatedRequest.id,
    });
  } catch (error) {
    console.error("Error al actualizar la solicitud de proyecto:", error);
    return NextResponse.json(
      { message: "Error al actualizar la solicitud de proyecto", error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
