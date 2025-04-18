import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/get-user-from-token";
import bcrypt from "bcryptjs";
import { Prisma, CompanyUser } from "@prisma/client";
import { handleRouteParams } from "@/lib/route-params";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const userId = await getUserFromToken();
    const { id } = await params;

    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return new NextResponse(
        JSON.stringify({ error: "ID de empresa inválido" }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Verificar si la empresa existe y obtener sus usuarios
    const company = await prisma.company.findFirst({
      where: { 
        id: idNumber,
        isDeleted: false 
      },
      include: {
        CompanyUser: {
          where: {
            isDeleted: false,
          },
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!company) {
      return new NextResponse(
        JSON.stringify({ error: "Empresa no encontrada" }),
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Si no hay usuarios, devolver array vacío
    if (!company.CompanyUser || company.CompanyUser.length === 0) {
      return new NextResponse(
        JSON.stringify({ users: [] }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Transformar los datos para el formato esperado
    const users = company.CompanyUser.map((cu: CompanyUser & {
      user: {
        id: number;
        email: string;
        username: string;
        isActive: boolean;
        profile: any;
      };
    }) => ({
      id: cu.user.id,
      email: cu.user.email,
      username: cu.user.username,
      isActive: cu.user.isActive,
      roleCompany: cu.roleCompany,
      profile: cu.user.profile,
    }));

    return new NextResponse(
      JSON.stringify({ users }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching company users:", error);
    return new NextResponse(
      JSON.stringify({ error: "Error al obtener los usuarios de la empresa" }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return new NextResponse(
        JSON.stringify({ error: "ID de empresa inválido" }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Error al procesar los datos",
          details: "Los datos enviados no son un JSON válido"
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Validar que los campos requeridos estén presentes y no sean undefined/null
    const requiredFields = ['email', 'username', 'password', 'role', 'roleCompany', 'name', 'first_lastname'];
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

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Email inválido",
          details: "El formato del email no es válido"
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Crear el usuario y su perfil en una transacción
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Crear o actualizar el usuario
        const user = await tx.user.create({
          data: {
            email,
            username,
            password: hashedPassword,
            role: {
              connect: {
                name: role === "Asociado" ? "Admin" : "Staff",
              },
            },
          },
          include: {
            profile: true,
          },
        });

        // Crear o actualizar el perfil
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

        // Crear la relación con la empresa
        const companyUser = await tx.companyUser.create({
          data: {
            userId: user.id,
            companyId,
            roleCompany,
            isActive: true,
            isDeleted: false,
          },
        });

        return {
          data: {
            id: user.id,
            email: user.email,
            username: user.username,
            isActive: user.isActive,
            roleCompany: companyUser.roleCompany,
            profile,
          }
        };
      });

      return new NextResponse(
        JSON.stringify(result),
        { 
          status: 201,
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
          error: "Error al crear el usuario",
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
    console.error("Error creating user:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Error al crear el usuario",
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const { id, userId } = await params;
    const companyId = parseInt(id);
    const userIdNum = parseInt(userId);

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
          email,
          username,
          role: {
            connect: {
              name: role === "Asociado" ? "Admin" : "Staff",
            },
          },
        };

        // Solo incluir la contraseña si se proporcionó una nueva
        if (password) {
          updateData.password = await bcrypt.hash(password, 10);
        }

        // Actualizar el usuario
        const user = await tx.user.update({
          where: { id: userIdNum },
          data: updateData,
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
