"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type LocationState } from "@/lib/schemas/cat_location_states";
import { getToken } from "@/lib/auth";

interface LocationSelectorProps {
  value?: number;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
}

export function LocationSelector({
  value,
  onChange,
  error,
  disabled
}: LocationSelectorProps) {
  const [states, setStates] = useState<LocationState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch("/api/cat_estados", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        if (!response.ok) {
          throw new Error("Error al cargar estados");
        }
        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error("Error fetching states:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStates();
  }, []);

  const handleChange = (newValue: string) => {
    const numericValue = parseInt(newValue, 10);
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  };

  const selectedState = states.find(s => s.id === value);

  return (
    <div className="space-y-1">
      <Select
        value={value?.toString()}
        onValueChange={handleChange}
        disabled={isLoading || disabled}
      >
        <SelectTrigger className={error ? "border-destructive ring-destructive" : ""}>
          <SelectValue placeholder={isLoading ? "Cargando estados..." : "Selecciona un estado"}>
            {selectedState?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-slate-950 z-50">
          {states.map((state) => (
            <SelectItem 
              key={state.id} 
              value={state.id.toString()}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {state.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
