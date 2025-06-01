import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { getProjectStatusByKey } from "@/config/project-status";
// Tooltips eliminados para reducir ruido visual

export type StepStatus = "pending" | "in-progress" | "completed";

export interface Step {
  id: string | number;
  title: string;
  status: StepStatus;
  description?: string;
  progress?: number; // Porcentaje de progreso de la categoría
}

interface StepperProps {
  steps: Step[];
  progress: number;
  className?: string;
  onStepClick?: (stepId: string | number) => void;
  activeStepId?: string | number;
}

export function Stepper({ steps, progress, className = "", onStepClick, activeStepId }: StepperProps) {
  // Mapeo de estados a claves de configuración
  const statusToKey: Record<StepStatus, string> = {
    "completed": "completed",
    "in-progress": "in_progress",
    "pending": "not_started"
  };

  // Obtener colores de la configuración
  const getStepStyles = (status: StepStatus) => {
    const key = statusToKey[status];
    const config = getProjectStatusByKey(key);
    
    // Si encontramos estilos en la configuración, los usamos
    if (config?.stepper?.styles) {
      return config.stepper.styles;
    }
    
    // Valores por defecto en caso de que no existan en la configuración
    if (status === "completed") {
      return {
        circle: "bg-green-500 text-white border-2 border-green-500",
        icon: "text-white"
      };
    } else if (status === "in-progress") {
      return {
        circle: "bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 dark:text-blue-500",
        icon: "text-blue-500"
      };
    } else {
      return {
        circle: "bg-white dark:bg-gray-800 border-2 border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400",
        icon: "text-slate-500 dark:text-slate-400"
      };
    }
  };

  // Obtener el color de la línea de progreso de la configuración
  const getProgressLineColor = () => {
    // Buscamos el estado "in-progress" para obtener el color de la línea
    const inProgressConfig = getProjectStatusByKey("in_progress");
    return inProgressConfig?.stepper?.styles?.progressLine || "bg-blue-500 dark:bg-blue-500";
  };

  const progressLineColor = getProgressLineColor();

  return (
    <div className={`mt-4 mb-6 relative ${className}`}>
      {/* Contenedor principal con altura fija para mantener alineación */}
      <div className="h-20 relative">
        {/* Línea horizontal que atraviesa todos los círculos */}
        <div className="absolute top-4 h-0.5 bg-gray-200 dark:bg-gray-600" style={{ left: "calc(0.5rem)", right: "calc(0.5rem)" }}></div>
        
        {/* Línea de progreso con color desde la configuración */}
        <div 
          className={`absolute top-4 h-0.5 ${progressLineColor}`}
          style={{
            left: "calc(0.5rem)",
            width: `${progress}%`,
            maxWidth: 'calc(100% - 1rem)',
            transition: 'width 0.5s ease-in-out'
          }}
        ></div>

        {/* Contenedor de los círculos */}
        <div className="flex justify-between relative w-full px-4 mx-0">
          {steps.map((step, index) => {
            const styles = getStepStyles(step.status);
            const isActive = activeStepId === step.id;
            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Círculo clickeable (sin tooltip) */}
                <button 
                  type="button"
                  onClick={() => onStepClick && onStepClick(step.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${styles.circle} ${isActive ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900' : ''} transition-all cursor-pointer hover:scale-110`}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className={`h-5 w-5 ${styles.icon}`} />
                  ) : (
                    <span className="text-sm font-bold">
                      {index + 1}
                    </span>
                  )}
                </button>
                
                {/* Nombre del paso y progreso */}
                <div className="mt-3 flex flex-col items-center">
                  <span className="text-sm font-medium text-center max-w-[100px] truncate dark:text-gray-300">
                    {step.title}
                  </span>
                  {step.progress !== undefined && (
                    <div className="flex items-center mt-1">
                      <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${step.progress}%`,
                            backgroundColor: step.status === "completed" ? "#22c55e" : 
                                            step.status === "in-progress" ? "#3b82f6" : "#94a3b8"
                          }}
                        ></div>
                      </div>
                      <span className="text-xs ml-1 text-muted-foreground dark:text-gray-400">
                        {step.progress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
