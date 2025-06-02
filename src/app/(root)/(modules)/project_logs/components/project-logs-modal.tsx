import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ProjectLog } from "../types";
import { LogMessageType } from "../types";
import { getToken } from "@/lib/auth";
import { useUnreadMessages } from "../context/unread-messages-context";

interface ProjectLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectTitle: string;
  categoryName?: string;
  associateName?: string;
}

function formatDateForDisplay(dateString: string | Date | undefined): string {
  if (!dateString) return "Fecha no disponible";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Fecha inválida";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProjectLogsModal({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  categoryName,
  associateName,
}: ProjectLogsModalProps) {
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const { markAsRead } = useUnreadMessages();

  useEffect(() => {
    if (open && projectId) {
      fetchLogs();
      
      // Marcar como leídos inmediatamente al abrir el modal
      if (projectId) {
        // Marcar como leídos en el contexto inmediatamente
        markAsRead(projectId);
        
        // También enviar la actualización al servidor
        markLogsAsRead();
      }
    }
  }, [open, projectId, markAsRead]);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0; 
    }
  }, [logs]);

  const markLogsAsRead = async () => {
    if (markingAsRead || !projectId) return;
    
    setMarkingAsRead(true);
    try {
      const token = getToken();
      if (!token) {
        return;
      }
      
      const response = await fetch(`/api/projects/logs/read-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error al marcar mensajes como leídos: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Si hay mensajes marcados como leídos, actualizar el contexto nuevamente
      // para asegurar que el indicador desaparezca
      if (data.messagesMarked > 0) {
        markAsRead(projectId);
      }
    } catch (error) {
      // No mostramos el error al usuario para no interrumpir la experiencia
    } finally {
      setMarkingAsRead(false);
    }
  };

  const fetchLogs = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        return;
      }
      
      const url = `/api/projects/${projectId}/logs`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error al obtener logs: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Manejar la estructura de respuesta
      const logsData = data.logs || data; // Compatibilidad con ambas estructuras
      
      setLogs(logsData);
    } catch (error) {
      setError("No se pudo cargar la bitácora. Por favor, intenta de nuevo.");
      toast.error("No se pudo cargar la bitácora");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    if (!projectId) {
      toast.error("No se puede enviar un mensaje sin un proyecto específico");
      return;
    }
    
    setSendingMessage(true);
    
    try {
      const token = getToken();
      if (!token) {
        return;
      }
      
      const response = await fetch("/api/projects/logs/create", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: newMessage,
          projectId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al enviar el mensaje: ${errorData.error || response.statusText}`);
      }
      
      setNewMessage("");
      fetchLogs();
      toast.success("Mensaje enviado correctamente");
    } catch (error) {
      toast.error("Error al enviar el mensaje");
    } finally {
      setSendingMessage(false);
    }
  };

  const getMessageType = (log: ProjectLog): LogMessageType => {
    if (log.message.startsWith("[SISTEMA]")) {
      return LogMessageType.SYSTEM;
    }
    
    if (log.userRole === "Administrador" || log.userRole === "Operador") {
      return LogMessageType.ADMIN;
    }
    
    return LogMessageType.ASSOCIATE;
  };

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bitácora del Proyecto: {projectTitle}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {categoryName && <p>Categoría: {categoryName}</p>}
            {associateName && <p>Asociado: {associateName}</p>}
          </div>
        </DialogHeader>
        
        <div className="flex flex-col" style={{ height: 'calc(70vh - 100px)' }}>
          <div 
            ref={logsContainerRef}
            className="flex-1 border rounded-md mb-4 overflow-y-scroll" 
            style={{ height: 'calc(100% - 120px)', minHeight: '200px' }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-full p-4">
                <p>Cargando mensajes...</p>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-full p-4 text-red-500">
                <p>{error}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex justify-center items-center h-full p-4 text-gray-500">
                <p>No hay mensajes en la bitácora para este proyecto</p>
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
                      {log.categoryName && (
                        <div className="mt-1 text-xs text-gray-500">
                          Categoría: {log.categoryName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {!error && (
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
