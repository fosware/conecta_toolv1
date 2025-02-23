import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getUserFromToken();
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return new NextResponse("Invalid project ID", { status: 400 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PROJECT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getUserFromToken();
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { message: "ID de proyecto inválido" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const projectTypeId = parseInt(formData.get("projectTypeId") as string);
    const clientId = parseInt(formData.get("clientId") as string);
    const clientAreaId = parseInt(formData.get("clientAreaId") as string);
    const specialRequest = formData.get("specialRequest") === "true";
    const descriptionSpecialRequest = formData.get("descriptionSpecialRequest") as string || null;
    const generalDescription = formData.get("generalDescription") as string || null;
    const drawRequest = formData.get("drawRequest") as Blob | null;

    if (!name || !projectTypeId || !clientId || !clientAreaId) {
      return NextResponse.json(
        { message: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const data: any = {
      name,
      projectTypeId,
      clientId,
      clientAreaId,
      specialRequest,
      descriptionSpecialRequest,
      generalDescription,
    };

    if (drawRequest) {
      const buffer = Buffer.from(await drawRequest.arrayBuffer());
      data.drawRequest = buffer;
      data.nameDrawRequest = (formData.get("nameDrawRequest") as string) || "file";
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        client: true,
        clientArea: true,
        projectType: true,
        projectQuote: true,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECT_UPDATE]", error);
    return NextResponse.json(
      { message: "Error al actualizar el proyecto" },
      { status: 500 }
    );
  }
}
