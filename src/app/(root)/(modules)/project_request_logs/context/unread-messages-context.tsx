import React, { createContext, useContext, useState, useCallback } from 'react';

// Clave para identificar una conversación única (proyecto-compañía-requerimiento)
export const getConversationKey = (projectId: number, companyId: number, requirementId: number): string => {
  return `${projectId}-${companyId}-${requirementId}`;
};

// Tipo para el contexto
interface UnreadMessagesContextType {
  getUnreadCount: (projectId: number, companyId: number, requirementId: number) => number;
  updateUnreadCount: (projectId: number, companyId: number, requirementId: number, count: number) => void;
  markAsRead: (projectId: number, companyId: number, requirementId: number) => void;
}

// Crear el contexto
const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

// Proveedor del contexto
export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado para almacenar los conteos de mensajes no leídos
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Obtener el conteo de mensajes no leídos para una conversación específica
  const getUnreadCount = useCallback((projectId: number, companyId: number, requirementId: number): number => {
    const key = getConversationKey(projectId, companyId, requirementId);
    return unreadCounts[key] || 0;
  }, [unreadCounts]);

  // Actualizar el conteo de mensajes no leídos para una conversación específica
  const updateUnreadCount = useCallback((projectId: number, companyId: number, requirementId: number, count: number): void => {
    const key = getConversationKey(projectId, companyId, requirementId);
    
    // Solo actualizar si el valor es diferente para evitar re-renderizados innecesarios
    setUnreadCounts(prev => {
      if (prev[key] === count) return prev;
      return { ...prev, [key]: count };
    });
  }, []);

  // Marcar todos los mensajes de una conversación como leídos
  const markAsRead = useCallback((projectId: number, companyId: number, requirementId: number): void => {
    const key = getConversationKey(projectId, companyId, requirementId);
    
    // Solo actualizar si hay mensajes no leídos para evitar re-renderizados innecesarios
    setUnreadCounts(prev => {
      if (prev[key] === 0 || prev[key] === undefined) return prev;
      return { ...prev, [key]: 0 };
    });
  }, []);

  return (
    <UnreadMessagesContext.Provider value={{ getUnreadCount, updateUnreadCount, markAsRead }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useUnreadMessages = (): UnreadMessagesContextType => {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error('useUnreadMessages debe ser usado dentro de un UnreadMessagesProvider');
  }
  return context;
};
