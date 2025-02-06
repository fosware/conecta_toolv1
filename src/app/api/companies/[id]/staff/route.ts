import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { staffSchema } from "@/lib/validations/staff";
import { sendWelcomeEmail } from "@/lib/email";
import { getUserFromToken } from "@/lib/get-user-from-token";

// GET: Obtener lista de staff de una empresa
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validar el token y obtener el userId
    const userId = await getUserFromToken();

    // Obtener y validar el companyId
    const { id } = await params;
    const companyId = parseInt(id);
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID de compañía inválido" },
        { status: 400 }
      );
    }

    // Obtener los miembros del staff
    const staff = await prisma.companyUser.findMany({
      where: {
        companyId,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            isActive: true,
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ data: staff });
  } catch (error) {
    console.error("Error loading staff:", error);
    return NextResponse.json(
      { error: "Error al cargar el personal" },
      { status: 500 }
    );
  }
}

// POST: Crear o actualizar staff
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validar el token y obtener el userId
    const userId = await getUserFromToken();

    // Obtener y validar el companyId
    const { id } = await params;
    const companyId = parseInt(id);
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID de compañía inválido" },
        { status: 400 }
      );
    }

    // Validar el body de la petición
    const body = await request.json();
    const validationResult = staffSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Validar que el username y email no existan
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validatedData.username },
          { email: validatedData.email }
        ],
        ...(validatedData.staff ? { NOT: { id: validatedData.staff.userId } } : {}),
      },
    });

    if (existingUser) {
      const field = existingUser.username === validatedData.username ? "usuario" : "email";
      return NextResponse.json(
        { error: `El ${field} ya está en uso` },
        { status: 400 }
      );
    }

    // Si es una actualización
    if (validatedData.staff) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.update({
            where: { id: validatedData.staff!.userId },
            data: {
              email: validatedData.email,
              username: validatedData.username,
              profile: {
                update: {
                  name: validatedData.name,
                  first_lastname: validatedData.first_lastname,
                  second_lastname: validatedData.second_lastname || null,
                  phone: validatedData.phone || null,
                },
              },
            },
          });

          const staff = await tx.companyUser.update({
            where: {
              id: validatedData.staff!.userId,
            },
            data: {
              role: validatedData.role,
              isAdmin: false,
              position: validatedData.role,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  isActive: true,
                  profile: true,
                },
              },
            },
          });

          return { user, staff };
        });

        return NextResponse.json({ data: result.staff });
      } catch (error) {
        console.error("Error updating staff:", error);
        return NextResponse.json(
          { error: "Error al actualizar el miembro del personal" },
          { status: 500 }
        );
      }
    }

    // Si es una creación
    try {
      const temporaryPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hash(temporaryPassword, 12);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: validatedData.email,
            username: validatedData.username,
            password: hashedPassword,
            mustChangePassword: true,
            roleId: 3, // Role STAFF
            isActive: true,
            profile: {
              create: {
                name: validatedData.name,
                first_lastname: validatedData.first_lastname,
                second_lastname: validatedData.second_lastname || null,
                phone: validatedData.phone || null,
              },
            },
          },
        });

        const staff = await tx.companyUser.create({
          data: {
            userId: user.id,
            companyId,
            role: validatedData.role,
            isAdmin: false,
            position: validatedData.role,
            isDeleted: false,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                isActive: true,
                profile: true,
              },
            },
          },
        });

        return { user, staff };
      });

      try {
        await sendWelcomeEmail({
          to: validatedData.email,
          username: validatedData.username,
          password: temporaryPassword,
          name: validatedData.name || validatedData.username,
        });

        return NextResponse.json({
          data: result.staff,
          temporaryPassword,
          emailSent: true,
        });
      } catch (error) {
        console.error("Error sending welcome email:", error);
        return NextResponse.json({
          data: result.staff,
          temporaryPassword,
          emailSent: false,
          emailError: error instanceof Error ? error.message : "Error al enviar el correo de bienvenida",
        });
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      return NextResponse.json(
        { error: "Error al crear el miembro del personal" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in staff route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
