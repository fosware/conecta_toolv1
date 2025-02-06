import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/get-user-from-token";
import { z } from "zod";

const updateStaffSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  name: z.string().min(2).optional(),
  first_lastname: z.string().min(2).optional(),
  second_lastname: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

// GET: Obtener un miembro específico del staff
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const userId = await getUserFromToken();
    const { id, userId: staffUserId } = await params;
    const companyId = parseInt(id);
    const staffId = parseInt(staffUserId);

    if (isNaN(companyId) || isNaN(staffId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Obtener el usuario con su rol y relación con la empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        companyUser: {
          where: {
            companyId,
            isDeleted: false,
          },
        },
      },
    });
    console.log("GET /staff/[userId] - user:", user);

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si es Admin o es administrador de la empresa, permitir acceso
    if (user.role.name.toUpperCase() === "ADMIN" || (user.companyUser && user.companyUser.isAdmin)) {
      console.log("GET /staff/[userId] - user has access");

      const staffMember = await prisma.companyUser.findFirst({
        where: {
          companyId,
          userId: staffId,
          isDeleted: false,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              isActive: true,
              profile: {
                select: {
                  name: true,
                  first_lastname: true,
                  second_lastname: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!staffMember) {
        return NextResponse.json(
          { error: "Miembro del staff no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(staffMember);
    }

    // Si no es Admin ni administrador de la empresa, denegar acceso
    return NextResponse.json(
      { error: "No tienes permisos para ver este staff" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error al obtener miembro del staff:", error);
    return NextResponse.json(
      { error: "Error al obtener el miembro del staff" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un miembro del staff
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const userId = await getUserFromToken();
    const { id, userId: staffUserId } = await params;
    const companyId = parseInt(id);
    const staffId = parseInt(staffUserId);
    const body = await request.json();

    if (isNaN(companyId) || isNaN(staffId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Validar datos
    const validatedData = updateStaffSchema.parse(body);

    // Obtener el usuario con su rol y relación con la empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        companyUser: {
          where: {
            companyId,
            isDeleted: false,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si es Admin o es administrador de la empresa, permitir actualización
    if (user.role.name.toUpperCase() === "ADMIN" || (user.companyUser && user.companyUser.isAdmin)) {
      const updatedStaff = await prisma.$transaction(async (tx) => {
        // Actualizar usuario
        const userUpdateData: any = {};
        if (validatedData.email) userUpdateData.email = validatedData.email;
        if (validatedData.username) userUpdateData.username = validatedData.username;
        if (validatedData.isActive !== undefined) userUpdateData.isActive = validatedData.isActive;

        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: { id: staffId },
            data: userUpdateData,
          });
        }

        // Actualizar perfil
        const profileUpdateData: any = {};
        if (validatedData.name) profileUpdateData.name = validatedData.name;
        if (validatedData.first_lastname) profileUpdateData.first_lastname = validatedData.first_lastname;
        if (validatedData.second_lastname !== undefined) profileUpdateData.second_lastname = validatedData.second_lastname;
        if (validatedData.phone !== undefined) profileUpdateData.phone = validatedData.phone;

        if (Object.keys(profileUpdateData).length > 0) {
          await tx.profile.update({
            where: { userId: staffId },
            data: profileUpdateData,
          });
        }

        // Actualizar relación con la empresa
        if (validatedData.position) {
          await tx.companyUser.update({
            where: {
              userId: staffId,
              companyId,
            },
            data: { position: validatedData.position },
          });
        }

        return tx.companyUser.findFirst({
          where: {
            companyId,
            userId: staffId,
            isDeleted: false,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                isActive: true,
                profile: {
                  select: {
                    name: true,
                    first_lastname: true,
                    second_lastname: true,
                    phone: true,
                  },
                },
              },
            },
          },
        });
      });

      if (!updatedStaff) {
        return NextResponse.json(
          { error: "Miembro del staff no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(updatedStaff);
    }

    // Si no es Admin ni administrador de la empresa, denegar acceso
    return NextResponse.json(
      { error: "No tienes permisos para actualizar este staff" },
      { status: 403 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar miembro del staff:", error);
    return NextResponse.json(
      { error: "Error al actualizar el miembro del staff" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un miembro del staff (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const userId = await getUserFromToken();
    const { id, userId: staffUserId } = await params;
    const companyId = parseInt(id);
    const staffId = parseInt(staffUserId);

    if (isNaN(companyId) || isNaN(staffId)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Obtener el usuario con su rol y relación con la empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        companyUser: {
          where: {
            companyId,
            isDeleted: false,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si es Admin o es administrador de la empresa, permitir eliminación
    if (user.role.name.toUpperCase() === "ADMIN" || (user.companyUser && user.companyUser.isAdmin)) {
      await prisma.companyUser.update({
        where: {
          userId: staffId,
          companyId,
        },
        data: { isDeleted: true },
      });

      return NextResponse.json({ success: true });
    }

    // Si no es Admin ni administrador de la empresa, denegar acceso
    return NextResponse.json(
      { error: "No tienes permisos para eliminar este staff" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error al eliminar miembro del staff:", error);
    return NextResponse.json(
      { error: "Error al eliminar el miembro del staff" },
      { status: 500 }
    );
  }
}
