"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CalendarProps {
  className?: string
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  mode?: "single" | "range" | "multiple"
  initialFocus?: boolean
}

function Calendar({
  className,
  selected,
  onSelect,
  disabled,
  mode = "single",
  initialFocus = false,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    return selected ? new Date(selected) : new Date()
  })
  
  React.useEffect(() => {
    if (initialFocus && selected) {
      setCurrentMonth(new Date(selected))
    }
  }, [initialFocus, selected])

  // Establecer el primer día del mes actual para la vista
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  
  // Obtener el nombre del mes y año para mostrar en el encabezado
  const monthName = currentMonth.toLocaleString('es-ES', { month: 'long' })
  const year = currentMonth.getFullYear()
  
  // Ir al mes anterior
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  // Ir al mes siguiente
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  
  // Obtener los días del mes actual
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  // Obtener el día de la semana del primer día del mes (0 = domingo, 1 = lunes, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }
  
  // Generar los días del mes para mostrar en el calendario
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    // Ajustar para que la semana comience en lunes (0 = lunes, 6 = domingo)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1
    
    const days = []
    
    // Días del mes anterior para completar la primera semana
    const daysInPrevMonth = getDaysInMonth(year, month - 1)
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({
        date,
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false,
        isDisabled: disabled ? disabled(date) : false
      })
    }
    
    // Días del mes actual
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const isToday = date.getTime() === today.getTime()
      const isSelected = selected ? 
        date.getFullYear() === selected.getFullYear() && 
        date.getMonth() === selected.getMonth() && 
        date.getDate() === selected.getDate() : false
      
      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        isSelected,
        isToday,
        isDisabled: disabled ? disabled(date) : false
      })
    }
    
    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length // 6 semanas x 7 días = 42
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push({
        date,
        day: i,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false,
        isDisabled: disabled ? disabled(date) : false
      })
    }
    
    return days
  }
  
  const calendarDays = generateCalendarDays()
  
  // Nombres de los días de la semana
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  
  return (
    <div className={cn("p-3 select-none", className)}>
      {/* Encabezado del calendario */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-7 w-7 bg-transparent p-0" 
          onClick={prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-medium text-sm">
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-7 w-7 bg-transparent p-0" 
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div 
            key={index} 
            className="text-center text-xs text-muted-foreground font-medium"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <Button
            key={index}
            variant="ghost"
            className={cn(
              "h-9 w-9 p-0 font-normal text-sm",
              !day.isCurrentMonth && "text-muted-foreground opacity-50",
              day.isToday && "bg-accent text-accent-foreground",
              day.isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day.isDisabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={day.isDisabled}
            onClick={() => {
              if (!day.isDisabled && onSelect) {
                onSelect(day.date)
              }
            }}
          >
            {day.day}
          </Button>
        ))}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
