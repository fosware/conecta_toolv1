import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { projectCreateSchema } from "@/lib/schemas/project";

export async function GET(request: NextRequest) {
  try {
    await getUserFromToken();

    const projects = await prisma.project.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        client: true,
        clientArea: true,
        projectType: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener los proyectos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken();
    const formData = await request.formData();

    const data = {
      name: formData.get("name"),
      projectTypeId: formData.get("projectTypeId"),
      clientId: formData.get("clientId"),
      clientAreaId: formData.get("clientAreaId"),
      specialRequest: formData.get("specialRequest") === "true",
      descriptionSpecialRequest: formData.get("descriptionSpecialRequest"),
      generalDescription: formData.get("generalDescription"),
      drawRequest: formData.get("drawRequest"),
      nameDrawRequest: formData.get("drawRequest") && typeof formData.get("drawRequest") === "object" && "name" in formData.get("drawRequest")
        ? (formData.get("drawRequest") as { name: string }).name
        : null,
    };

    const validatedData = projectCreateSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: validatedData.data.name,
        projectTypeId: validatedData.data.projectTypeId,
        clientId: validatedData.data.clientId,
        clientAreaId: validatedData.data.clientAreaId,
        specialRequest: validatedData.data.specialRequest,
        descriptionSpecialRequest: validatedData.data.descriptionSpecialRequest,
        generalDescription: validatedData.data.generalDescription,
        nameDrawRequest: validatedData.data.nameDrawRequest,
        drawRequest: validatedData.data.drawRequest
          ? Buffer.from(await validatedData.data.drawRequest.arrayBuffer())
          : null,
        userId,
      },
      include: {
        projectType: true,
        client: true,
        clientArea: true,
        projectQuote: {
          where: {
            isDeleted: false,
          },
          include: {
            company: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("[PROJECTS_POST]", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
