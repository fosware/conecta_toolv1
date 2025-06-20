"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangeSelectorProps {
  onDateChange: (startDate: string | null, endDate: string | null) => void;
}

export function DateRangeSelector({ onDateChange }: DateRangeSelectorProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectingStart, setSelectingStart] = useState(true);

  const handleSelect = (date: Date | undefined) => {
    if (selectingStart) {
      setStartDate(date);
      setSelectingStart(false);
    } else {
      setEndDate(date);
      setSelectingStart(true);
    }
  };

  const formatDateToString = (date: Date | undefined): string | null => {
    if (!date) return null;
    return date.toISOString().split('T')[0]; // formato yyyy-MM-dd
  };
  
  const formatDateDisplay = (date: Date | undefined): string => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleApply = () => {
    const formattedStartDate = formatDateToString(startDate);
    const formattedEndDate = formatDateToString(endDate);
    onDateChange(formattedStartDate, formattedEndDate);
  };

  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectingStart(true);
    onDateChange(null, null);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="grid gap-2 relative">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                endDate ? (
                  <>
                    {formatDateDisplay(startDate)} -{" "}
                    {formatDateDisplay(endDate)}
                  </>
                ) : (
                  formatDateDisplay(startDate)
                )
              ) : (
                <span>Seleccionar fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 bg-background border border-border shadow-md z-50" 
            align="start"
            sideOffset={4}
          >
            <div className="bg-background text-foreground">
              <Calendar
                mode="single"
                selected={selectingStart ? startDate : endDate}
                onSelect={handleSelect}
                initialFocus
                className="bg-background text-foreground"
              />
              <div className="p-3 border-t border-border">
                <div className="mb-2 text-sm text-foreground">
                  {selectingStart ? "Seleccione fecha inicial" : "Seleccione fecha final"}
                </div>
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReset}
                    className="bg-background hover:bg-hover text-foreground"
                  >
                    Limpiar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleApply}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
