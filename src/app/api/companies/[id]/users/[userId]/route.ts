import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { handleRouteParams } from "@/lib/route-params";

export async function PUT(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    const { id, userId: targetUserId } = await params;
    const companyId = parseInt(id);
    const userIdNum = parseInt(targetUserId);

    if (isNaN(companyId) || isNaN(userIdNum)) {
      return new NextResponse(
        JSON.stringify({ error: "ID inválido" }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data = await request.json();
    const {
      email,
      username,
      password,
      role,
      roleCompany,
      name,
      first_lastname,
      second_lastname,
      phone,
    } = data;

    // Validar campos requeridos
    const requiredFields = ['email', 'username', 'role', 'roleCompany', 'name', 'first_lastname'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Faltan campos requeridos",
          details: `Los siguientes campos son requeridos: ${missingFields.join(', ')}`
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Preparar los datos de actualización del usuario
        const updateData: any = {
          role: {
            connect: {
              name: role,
            },
          },
        };

        // Solo incluir la contraseña si se proporcionó una nueva
        if (password) {
          updateData.password = await bcrypt.hash(password, 10);
        }

        // Actualizar el usuario
        const user = await tx.user.update({
          where: { 
            id: userIdNum,
          },
          data: {
            ...updateData,
            email: {
              set: email,
            },
            username: {
              set: username,
            },
          },
          include: {
            profile: true,
          },
        });

        // Actualizar el perfil
        const profile = await tx.profile.upsert({
          where: { userId: user.id },
          create: {
            name,
            first_lastname,
            second_lastname: second_lastname || null,
            phone: phone || null,
            userId: user.id,
          },
          update: {
            name,
            first_lastname,
            second_lastname: second_lastname || null,
            phone: phone || null,
          },
        });

        // Actualizar el rol en la empresa
        await tx.companyUser.updateMany({
          where: {
            userId: user.id,
            companyId,
            isDeleted: false,
          },
          data: {
            roleCompany,
          },
        });

        return {
          data: {
            id: user.id,
            email: user.email,
            username: user.username,
            isActive: user.isActive,
            roleCompany,
            profile,
          }
        };
      });

      return new NextResponse(
        JSON.stringify(result),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return new NextResponse(
            JSON.stringify({ 
              error: "El email o nombre de usuario ya está en uso por un usuario activo"
            }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }

      return new NextResponse(
        JSON.stringify({ 
          error: "Error al actualizar el usuario",
          details: error instanceof Error ? error.message : "Error desconocido"
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Error al actualizar el usuario",
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    // Verificar autenticación
    await getUserFromToken();
    const { id, userId } = await params;

    const companyId = parseInt(id);
    const targetUserId = parseInt(userId);

    if (isNaN(companyId) || isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    // Verificar si existe la relación usuario-empresa
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        companyId,
        userId: targetUserId,
        isDeleted: false,
      },
    });

    if (!companyUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado en la empresa" },
        { status: 404 }
      );
    }

    // Marcar como eliminado en una transacción
    await prisma.$transaction(async (prisma) => {
      // Marcar el CompanyUser como eliminado
      await prisma.companyUser.update({
        where: {
          companyId_userId: {
            companyId,
            userId: targetUserId,
          },
        },
        data: {
          isDeleted: true,
        },
      });

      // Si el usuario no pertenece a ninguna otra empresa activa, marcarlo como eliminado también
      const otherActiveCompanies = await prisma.companyUser.findFirst({
        where: {
          userId: targetUserId,
          isDeleted: false,
          NOT: {
            companyId,
          },
        },
      });

      if (!otherActiveCompanies) {
        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            isDeleted: true,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Error al eliminar el usuario" },
      { status: 500 }
    );
  }
}
