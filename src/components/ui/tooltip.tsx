import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  className?: string
  maxWidth?: string
}

export function Tooltip({ content, children, side = "bottom", className, maxWidth = "200px" }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  
  // Posiciones para los diferentes lados
  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2"
  }
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && content && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-sm rounded-md border bg-slate-800 text-white shadow-md",
            positions[side],
            className
          )}
          style={{ maxWidth, whiteSpace: "normal", lineHeight: "1.4" }}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// Componentes para mantener compatibilidad con la API anterior
export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export const TooltipTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => {
  return <>{children}</>
}

export const TooltipContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}
