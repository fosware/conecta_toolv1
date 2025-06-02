import React, { useEffect, useState, useRef } from 'react';
import { getToken } from '@/lib/auth';
import { useUnreadMessages, getConversationKey } from '../context/unread-messages-context';

interface UnreadIndicatorProps {
  projectId: number;
  className?: string;
}

export default function UnreadIndicator({
  projectId,
  className = ''
}: UnreadIndicatorProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getUnreadCount, updateUnreadCount } = useUnreadMessages();
  const unreadCount = getUnreadCount(projectId);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Evitar múltiples peticiones para el mismo indicador
    if (fetchedRef.current) return;
    
    const fetchUnreadCount = async () => {
      if (!projectId) {
        return;
      }
      
      setLoading(true);
      try {
        const token = getToken();
        if (!token) {
          return;
        }
        
        const url = `/api/projects/logs/unread-count?projectId=${projectId}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error al obtener conteo de mensajes no leídos: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Actualizar el conteo en el contexto
        updateUnreadCount(projectId, data.unreadCount || 0);
        fetchedRef.current = true;
      } catch (error) {
        setError("Error al verificar mensajes no leídos");
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();
  }, [projectId, updateUnreadCount]);

  // No mostrar nada si no hay mensajes no leídos o hay un error
  if (loading || error || unreadCount === 0) return null;
  
  // Mostrar el indicador solo si hay mensajes no leídos
  return (
    <div className={`absolute -top-2 -right-2 flex items-center justify-center bg-red-500 text-white rounded-full min-w-[20px] min-h-[20px] text-xs font-bold ${className}`} style={{ zIndex: 50 }}>
      {unreadCount > 9 ? '9+' : unreadCount}
    </div>
  );
}
