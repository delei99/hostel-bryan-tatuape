import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Hook para sincronização em tempo real de datas bloqueadas
 * Implementa polling para atualizar bloqueios automaticamente
 * Sincroniza entre múltiplas abas abertas do navegador
 */
export function useRealtimeBlockedDates(roomId: number, enabled: boolean = true) {
  const utils = trpc.useUtils();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !roomId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Função para sincronizar bloqueios
    const syncBlockedDates = async () => {
      try {
        // Invalidar cache para forçar recarregamento
        await utils.blockedDates.list.invalidate({ roomId });
        
        // Atualizar timestamp da última sincronização
        lastUpdateRef.current = Date.now();
        
        // Notificar outras abas via localStorage
        const syncEvent = {
          type: 'blockedDatesSync',
          roomId,
          timestamp: Date.now(),
        };
        localStorage.setItem('blockedDatesSync', JSON.stringify(syncEvent));
      } catch (error) {
        console.error('[useRealtimeBlockedDates] Erro ao sincronizar:', error);
      }
    };

    // Sincronizar imediatamente
    syncBlockedDates();

    // Configurar polling a cada 5 segundos
    pollingIntervalRef.current = setInterval(syncBlockedDates, 5000);

    // Listener para mudanças em outras abas
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'blockedDatesSync') {
        try {
          const syncEvent = JSON.parse(event.newValue || '{}');
          // Se a mudança é do mesmo quarto e de outra aba
          if (syncEvent.roomId === roomId && syncEvent.timestamp > lastUpdateRef.current) {
            syncBlockedDates();
          }
        } catch (error) {
          console.error('[useRealtimeBlockedDates] Erro ao processar evento de storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      // Limpar polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      // Remover listener
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [roomId, enabled, utils]);
}
