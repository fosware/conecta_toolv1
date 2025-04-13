import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ProjectRequestCompanyStatusLog } from "../types";
import { LogMessageType } from "../types";

interface ProjectRequestLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectRequestId: number;
  companyId?: number;
  title: string;
  requirementName?: string;
}

// Función para formatear la fecha para mostrar
function formatDateForDisplay(dateString: string | Date | undefined): string {
  if (!dateString) return "Fecha no disponible";

  // Crear una fecha a partir de la cadena
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Fecha inválida";

  // Usar toLocaleDateString para formatear la fecha correctamente según la configuración regional
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProjectRequestLogsModal({
  isOpen,
  onClose,
  projectRequestId,
  companyId,
  title,
  requirementName,
}: ProjectRequestLogsModalProps) {
  const [logs, setLogs] = useState<ProjectRequestCompanyStatusLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (isOpen && projectRequestId) {
      fetchLogs();
    }
  }, [isOpen, projectRequestId, companyId]);

  const fetchLogs = async () => {
    if (!projectRequestId) return;

    setLoading(true);
    try {
      let url = "";
      
      if (companyId) {
        // Si tenemos companyId, obtenemos logs específicos de esa relación
        url = `/api/project_requests/${projectRequestId}/company/${companyId}/logs`;
      } else {
        // Si no, obtenemos todos los logs del proyecto
        url = `/api/project_requests/${projectRequestId}/logs`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Error al obtener los logs");
      }
      
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("No se pudo cargar la bitácora");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    let projectRequestCompanyId: number | null = null;
    
    try {
      if (companyId) {
        // Si tenemos companyId, buscamos la relación específica
        const relationResponse = await fetch(
          `/api/project_requests/${projectRequestId}/participant/${companyId}`
        );
        
        if (!relationResponse.ok) {
          throw new Error("Error al obtener la relación proyecto-compañía");
        }
        
        const relationData = await relationResponse.json();
        
        if (relationData && relationData.id) {
          projectRequestCompanyId = relationData.id;
        } else {
          throw new Error("Error al obtener el ID de la relación proyecto-compañía");
        }
      } else {
        // Si no tenemos companyId, no podemos enviar un mensaje general
        // ya que los logs están asociados a relaciones específicas
        toast.error("No se puede enviar un mensaje sin especificar una compañía");
        return;
      }
      
      const response = await fetch("/api/project_requests/logs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: newMessage,
          projectRequestCompanyId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error("Error al enviar el mensaje");
      }
      
      // Limpiar el campo de mensaje y recargar los logs
      setNewMessage("");
      fetchLogs();
      
      toast.success("Mensaje enviado correctamente");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("No se pudo enviar el mensaje");
    } finally {
      setSendingMessage(false);
    }
  };

  // Función para determinar el tipo de mensaje (sistema, admin, asociado)
  const getMessageType = (log: ProjectRequestCompanyStatusLog): LogMessageType => {
    // Verificar si el mensaje comienza con [SISTEMA]
    if (log.message.startsWith("[SISTEMA]")) return LogMessageType.SYSTEM;
    
    const userRole = log.userRole?.toLowerCase() || "";
    if (userRole.includes("admin")) return LogMessageType.ADMIN;
    return LogMessageType.ASSOCIATE;
  };

  // Función para obtener la clase CSS según el tipo de mensaje
  const getMessageClass = (type: LogMessageType): string => {
    switch (type) {
      case LogMessageType.SYSTEM:
        return "bg-white border border-gray-300 text-gray-800";
      case LogMessageType.ADMIN:
        return "bg-white border border-blue-300 text-gray-800";
      case LogMessageType.ASSOCIATE:
        return "bg-white border border-green-300 text-gray-800";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {requirementName && (
            <p className="text-sm text-muted-foreground mt-1">
              Requerimiento: {requirementName}
            </p>
          )}
        </DialogHeader>
        
        {/* Contenedor principal con altura fija */}
        <div className="flex flex-col" style={{ height: 'calc(70vh - 100px)' }}>
          {/* Área de mensajes con altura fija y scroll */}
          <div 
            className="flex-1 border rounded-md mb-4 overflow-y-scroll" 
            style={{ height: 'calc(100% - 120px)', minHeight: '200px' }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-full p-4">
                <p>Cargando mensajes...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex justify-center items-center h-full p-4 text-gray-500">
                <p>No hay mensajes en la bitácora</p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {logs.map((log) => {
                  const messageType = getMessageType(log);
                  const messageClass = getMessageClass(messageType);
                  
                  return (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg ${messageClass}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold">
                          {messageType === LogMessageType.SYSTEM
                            ? "Sistema"
                            : log.userName || "Usuario"}
                          {log.userRole && messageType !== LogMessageType.SYSTEM && ` (${log.userRole})`}
                          {log.companyName && messageType !== LogMessageType.SYSTEM && ` - ${log.companyName}`}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateForDisplay(log.dateTimeMessage)}
                        </span>
                      </div>
                      <p className="text-sm">
                        {messageType === LogMessageType.SYSTEM 
                          ? log.message.replace("[SISTEMA] ", "") 
                          : log.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Área de entrada de mensaje */}
          {companyId && (
            <div className="space-y-2 pt-2" style={{ height: '120px' }}>
              <Textarea
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="resize-none"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? "Enviando..." : "Enviar mensaje"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
