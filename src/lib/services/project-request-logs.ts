import { prisma } from "@/lib/prisma";
import { SYSTEM_MESSAGES } from "@/app/(root)/(modules)/project_request_logs/constants";
import { CreateLogInput } from "@/app/(root)/(modules)/project_request_logs/types";

/**
 * Servicio para manejar los logs de seguimiento de solicitudes de proyecto
 */
export const ProjectRequestLogsService = {
  /**
   * Crea un nuevo log para una relación proyecto-compañía o para un proyecto
   */
  async createLog({
    projectRequestCompanyId,
    message,
    userId,
    isSystemMessage = false
  }: CreateLogInput) {
    try {
      // Nota: isSystemMessage no existe en el modelo de Prisma, pero lo guardamos en la interfaz
      // para uso interno. Podríamos añadirlo como parte del mensaje o en observaciones en el futuro.
      return await prisma.projectRequestCompanyStatusLog.create({
        data: {
          projectRequestCompanyId,
          message: isSystemMessage ? `[SISTEMA] ${message}` : message,
          userId,
          dateTimeMessage: new Date(),
          isActive: true,
          isDeleted: false,
        },
      });
    } catch (error) {
      console.error("Error al crear log:", error);
      throw error;
    }
  },

  /**
   * Crea un log de sistema automático basado en un evento predefinido
   * @param projectRequestCompanyId - ID de la relación proyecto-compañía o ID del proyecto
   * @param messageType - Tipo de mensaje del sistema
   * @param userId - ID del usuario que realiza la acción
   * @param isProjectLog - Indica si es un log a nivel de proyecto (no de empresa)
   */
  async createSystemLog(
    projectRequestCompanyId: number,
    messageType: keyof typeof SYSTEM_MESSAGES,
    userId: number,
    isProjectLog: boolean = false
  ) {
    try {
      const message = SYSTEM_MESSAGES[messageType];
      
      // Si es un log a nivel de proyecto, necesitamos obtener todas las relaciones proyecto-compañía
      // para crear un log en cada una de ellas
      if (isProjectLog) {
        // Buscar todas las relaciones proyecto-compañía para este proyecto
        const projectCompanies = await prisma.projectRequestCompany.findMany({
          where: {
            projectRequestId: projectRequestCompanyId,
            isActive: true,
            isDeleted: false,
          },
        });

        if (projectCompanies && projectCompanies.length > 0) {
          // Si existen relaciones, creamos un log para cada una
          const logPromises = projectCompanies.map(company => 
            this.createLog({
              projectRequestCompanyId: company.id,
              message,
              userId,
              isSystemMessage: true
            })
          );
          
          // Ejecutar todas las promesas de creación de logs
          await Promise.all(logPromises);
          return true;
        } else {
          // Si no existe ninguna relación, registramos una advertencia
          console.warn(`No se encontró ninguna relación proyecto-compañía para el proyecto ${projectRequestCompanyId}.`);
          return false;
        }
      }

      // Si no es un log a nivel de proyecto, crear el log normalmente para la relación específica
      return await this.createLog({
        projectRequestCompanyId,
        message,
        userId,
        isSystemMessage: true
      });
    } catch (error) {
      console.error("Error al crear log de sistema:", error);
      throw error;
    }
  },

  /**
   * Obtiene los logs de un proyecto (todos los logs de todas las compañías asociadas)
   */
  async getProjectLogs(projectRequestId: number) {
    try {
      const logs = await prisma.projectRequestCompanyStatusLog.findMany({
        where: {
          ProjectRequestCompany: {
            projectRequestId,
            isActive: true,
            isDeleted: false,
          },
          isActive: true,
          isDeleted: false,
        },
        orderBy: {
          dateTimeMessage: "desc",
        },
        include: {
          user: {
            select: {
              username: true,
              email: true,
              profile: {
                select: {
                  name: true,
                },
              },
            },
          },
          ProjectRequestCompany: {
            include: {
              Company: {
                select: {
                  comercialName: true,
                },
              },
            },
          },
        },
      });

      // Formatear la respuesta
      return logs.map((log) => ({
        id: log.id,
        projectRequestCompanyId: log.projectRequestCompanyId,
        message: log.message,
        dateTimeMessage: log.dateTimeMessage,
        isActive: log.isActive,
        isDeleted: log.isDeleted,
        dateDeleted: log.dateDeleted,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        userId: log.userId,
        userName: log.user?.username || "Usuario",
        userRole: log.user?.profile?.name || "Usuario",
        companyName: log.ProjectRequestCompany?.Company?.comercialName || "N/A",
        isSystemMessage: log.message.startsWith("[SISTEMA]"),
      }));
    } catch (error) {
      console.error("Error al obtener logs del proyecto:", error);
      throw error;
    }
  },
};
