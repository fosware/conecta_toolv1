/**
 * Configuración de estados de proyecto
 * Referencia a la tabla de estados en la base de datos
 */

export type ProjectStatusId = 1 | 2 | 3 | 4;

export interface ProjectStatusConfig {
  id: ProjectStatusId;
  name: string;
  key: string;
  badge: {
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "success"
      | "warning";
    className?: string;
    text: string;
  };
  stepper?: {
    status: "pending" | "in-progress" | "completed";
    styles?: {
      circle: string;
      icon: string;
      progressLine?: string;
    };
  };
}

/**
 * Configuración de los estados de proyecto
 * Estos valores deben coincidir con los IDs en la base de datos
 */
export const PROJECT_STATUS: Record<ProjectStatusId, ProjectStatusConfig> = {
  1: {
    id: 1,
    name: "Por iniciar",
    key: "not_started",
    badge: {
      variant: "outline",
      className:
        "text-slate-500 border-slate-500 bg-slate-50 dark:bg-slate-950/30",
      text: "Por iniciar",
    },
    stepper: {
      status: "pending",
      styles: {
        circle:
          "bg-white dark:bg-gray-800 border-2 border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400",
        icon: "text-slate-500 dark:text-slate-400",
      },
    },
  },
  2: {
    id: 2,
    name: "En Proceso",
    key: "in_progress",
    badge: {
      variant: "outline",
      className: "text-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/30",
      text: "En progreso",
    },
    stepper: {
      status: "in-progress",
      styles: {
        circle:
          "bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 dark:text-blue-500",
        icon: "text-blue-500",
        progressLine: "bg-blue-500 dark:bg-blue-500",
      },
    },
  },
  3: {
    id: 3,
    name: "Finalizado",
    key: "completed",
    badge: {
      variant: "outline",
      className:
        "text-green-500 border-green-500 bg-green-50 dark:bg-green-950/30",
      text: "Finalizado",
    },
    stepper: {
      status: "completed",
      styles: {
        circle: "bg-green-500 text-white border-2 border-green-500",
        icon: "text-white",
      },
    },
  },
  4: {
    id: 4,
    name: "Cancelado",
    key: "cancelled",
    badge: {
      variant: "outline",
      className: "text-red-500 border-red-500 bg-red-50 dark:bg-red-950/30",
      text: "Cancelado",
    },
  },
};

/**
 * Obtiene la configuración de un estado de proyecto por su ID
 */
export function getProjectStatusById(
  statusId: ProjectStatusId
): ProjectStatusConfig {
  return PROJECT_STATUS[statusId] || PROJECT_STATUS[1]; // Valor por defecto: Por iniciar
}

/**
 * Obtiene la configuración de un estado de proyecto por su clave
 */
export function getProjectStatusByKey(
  key: string
): ProjectStatusConfig | undefined {
  return Object.values(PROJECT_STATUS).find((status) => status.key === key);
}

/**
 * Obtiene todos los estados de proyecto como un array
 */
export function getAllProjectStatuses(): ProjectStatusConfig[] {
  return Object.values(PROJECT_STATUS);
}
