import { useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Hook para sincronização em tempo real de datas bloqueadas
 * Implementa polling para atualizar bloqueios automaticamente
 * Sincroniza entre múltiplas abas abertas do navegador
 */
export function useRealtimeBlockedDates(roomId: number, enabled: boolean = true) {
  const utils = trpc.useUtils();
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const utilsRef = useRef(utils);
  const roomIdRef = useRef(roomId);

  // Manter refs atualizadas sem disparar useEffect
  utilsRef.current = utils;
  roomIdRef.current = roomId;

  const syncBlockedDates = useCallback(async () => {
    try {
      await utilsRef.current.blockedDates.list.invalidate({ roomId: roomIdRef.current });
      lastUpdateRef.current = Date.now();
      
      const syncEvent = {
        type: 'blockedDatesSync',
        roomId: roomIdRef.current,
        timestamp: Date.now(),
      };
      try {
        localStorage.setItem('blockedDatesSync', JSON.stringify(syncEvent));
      } catch {
        // localStorage pode não estar disponível
      }
    } catch (error) {
      console.error('[useRealtimeBlockedDates] Erro ao sincronizar:', error);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !roomId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Sincronizar imediatamente
    syncBlockedDates();

    // Configurar polling a cada 5 segundos
    pollingIntervalRef.current = setInterval(syncBlockedDates, 5000);

    // Listener para mudanças em outras abas
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'blockedDatesSync') {
        try {
          const syncEvent = JSON.parse(event.newValue || '{}');
          if (syncEvent.roomId === roomIdRef.current && syncEvent.timestamp > lastUpdateRef.current) {
            syncBlockedDates();
          }
        } catch (error) {
          console.error('[useRealtimeBlockedDates] Erro ao processar evento de storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [roomId, enabled, syncBlockedDates]);
}
