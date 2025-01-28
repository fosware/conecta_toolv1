"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

interface LogoUploaderProps {
  value?: string;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export function LogoUploader({ value, onChange, error, disabled }: LogoUploaderProps) {
  // Para el preview necesitamos el prefijo, pero internamente solo guardamos base64
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    if (!value) return null;
    return value.startsWith('data:image') ? value : `data:image/png;base64,${value}`;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Crear URL para preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Enviar el archivo al formulario
    onChange(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full h-full min-h-[200px] border-2 border-dashed rounded-lg p-4 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'} transition-colors`}>
      {previewUrl ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-[180px] h-[180px]">
            <Image
              src={previewUrl}
              alt="Logo preview"
              fill
              className="object-contain"
              unoptimized
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
              onClick={() => {
                setPreviewUrl(null);
                onChange(null);
              }}
              disabled={disabled}
            >
              Eliminar logo
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="w-12 h-12 text-gray-400" />
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleUploadClick}
            disabled={disabled}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Subir logo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
