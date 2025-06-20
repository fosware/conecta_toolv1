"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  triggerRef: React.RefObject<HTMLElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}>({ 
  open: false, 
  setOpen: () => {}, 
  triggerRef: React.createRef<HTMLElement | null>(), 
  contentRef: React.createRef<HTMLDivElement | null>() 
})

const Popover = ({ children, open: controlledOpen, onOpenChange }: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  
  const setOpen = React.useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    if (onOpenChange) {
      const newValue = typeof value === "function" ? value(open) : value
      onOpenChange(newValue)
    }
  }, [isControlled, onOpenChange, open])
  
  // Cerrar el popover al hacer clic fuera
  React.useEffect(() => {
    if (!open) return
    
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        contentRef.current &&
        triggerRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [open, setOpen])
  
  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      {children}
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean
  children: React.ReactNode
}

const PopoverTrigger = React.forwardRef<HTMLElement, PopoverTriggerProps>(
  ({ asChild = false, children, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = React.useContext(PopoverContext)
    
    const ref = React.useMemo(() => {
      if (forwardedRef && typeof forwardedRef === "object") {
        return forwardedRef
      }
      return triggerRef
    }, [forwardedRef, triggerRef])
    
    const child = asChild ? React.Children.only(children) : <button {...props}>{children}</button>
    
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        // @ts-ignore - Ignoramos el error de tipado aquí ya que estamos seguros de que el elemento es válido
        ref,
        onClick: (e: React.MouseEvent) => {
          const originalOnClick = (child as any).props?.onClick
          if (originalOnClick) originalOnClick(e)
          setOpen(!open)
        },
        ...props,
      })
    }
    
    // @ts-ignore - Ignoramos el error de tipado ya que sabemos que funciona correctamente
    return <button ref={ref as any} onClick={() => setOpen(!open)} {...props}>{children}</button>
  }
)

PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, children, ...props }, forwardedRef) => {
    const { open, contentRef, triggerRef } = React.useContext(PopoverContext)
    const ref = React.useMemo(() => {
      if (forwardedRef && typeof forwardedRef === "object") {
        return forwardedRef
      }
      return contentRef
    }, [forwardedRef, contentRef])
    
    const [position, setPosition] = React.useState({ top: 0, left: 0 })
    
    React.useEffect(() => {
      if (open && triggerRef.current && contentRef.current) {
        const updatePosition = () => {
          // Verificar que los refs siguen siendo válidos antes de acceder a ellos
          if (!triggerRef.current || !contentRef.current) return;
          
          const triggerRect = triggerRef.current.getBoundingClientRect()
          const contentRect = contentRef.current.getBoundingClientRect()
          
          // Calcular la posición inicial (siempre debajo del trigger)
          let top = triggerRect.bottom + sideOffset + window.scrollY
          let left = 0
          
          // Alineación horizontal - siempre alineado con el trigger
          switch (align) {
            case "start":
              left = triggerRect.left + window.scrollX
              break
            case "center":
              left = triggerRect.left + window.scrollX + triggerRect.width / 2 - contentRect.width / 2
              break
            case "end":
              left = triggerRect.right + window.scrollX - contentRect.width
              break
            default:
              // Por defecto, alinear al inicio del trigger
              left = triggerRect.left + window.scrollX
          }
          
          // Asegurarse de que el popover no se salga de la ventana
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          
          // Ajustar posición horizontal si es necesario, pero mantener alineación con el trigger cuando sea posible
          if (left < 10) left = 10
          if (left + contentRect.width > viewportWidth - 10) {
            // Si se sale por la derecha, intentar mantener alineado con el borde derecho del trigger
            left = Math.max(10, viewportWidth - contentRect.width - 10)
          }
          
          // Si no hay espacio abajo, mostrar arriba
          if (top + contentRect.height > window.scrollY + viewportHeight - 10) {
            top = triggerRect.top + window.scrollY - contentRect.height - sideOffset
          }
          
          setPosition({ top, left })
        }
        
        // Actualizar posición inicialmente
        updatePosition()
        
        // Actualizar posición al hacer scroll o redimensionar la ventana
        window.addEventListener('scroll', updatePosition)
        window.addEventListener('resize', updatePosition)
        
        return () => {
          window.removeEventListener('scroll', updatePosition)
          window.removeEventListener('resize', updatePosition)
        }
      }
    }, [open, align, sideOffset, ref])
    
    if (!open) return null
    
    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-50 w-72 rounded-md border bg-background p-4 text-foreground shadow-md animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
