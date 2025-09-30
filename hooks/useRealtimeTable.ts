'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { REALTIME_CONFIG, RealtimeEvent } from '@/lib/supabase/realtime-config';

interface UseRealtimeTableOptions<T> {
  table: string;
  event?: RealtimeEvent;
  filter?: string;
  schema?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void;
  enabled?: boolean;
}

interface UseRealtimeTableReturn {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: Error | null;
  lastEvent: Date | null;
}

export function useRealtimeTable<T = any>(
  options: UseRealtimeTableOptions<T>
): UseRealtimeTableReturn {
  const {
    table,
    event = '*',
    filter,
    schema = 'public',
    onInsert,
    onUpdate,
    onDelete,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<UseRealtimeTableReturn['status']>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [lastEvent, setLastEvent] = useState<Date | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store callbacks in refs to avoid recreation
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);

  // Update refs when callbacks change
  useEffect(() => {
    onInsertRef.current = onInsert;
    onUpdateRef.current = onUpdate;
    onDeleteRef.current = onDelete;
  }, [onInsert, onUpdate, onDelete]);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (channelRef.current) {
      console.log(`🔌 [Realtime] Desconectando do canal: ${table}_realtime`);
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, [table]);

  const handlePayload = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      setLastEvent(new Date());

      switch (payload.eventType) {
        case 'INSERT':
          console.log(`🔄 [Realtime] Novo evento INSERT em ${table}`, payload.new);
          onInsertRef.current?.(payload);
          break;
        case 'UPDATE':
          console.log(`🔄 [Realtime] Novo evento UPDATE em ${table}`, payload.new);
          onUpdateRef.current?.(payload);
          break;
        case 'DELETE':
          console.log(`🔄 [Realtime] Novo evento DELETE em ${table}`, payload.old);
          onDeleteRef.current?.(payload);
          break;
      }
    },
    [table]
  );

  const connect = useCallback(() => {
    if (!enabled) {
      console.log(`⏸️ [Realtime] Realtime desabilitado para ${table}`);
      return;
    }

    // Don't reconnect if already connected
    if (channelRef.current) {
      console.log(`⚠️ [Realtime] Já conectado ao canal: ${table}_realtime`);
      return;
    }

    try {
      setStatus('connecting');
      setError(null);

      const supabase = createClient();
      const channelName = `${table}_realtime`;

      console.log(`🔌 [Realtime] Conectando ao canal: ${channelName}`);

      const channel = supabase.channel(channelName);

      // Configure o event listener
      const changeConfig: any = {
        event,
        schema,
        table,
      };

      if (filter) {
        changeConfig.filter = filter;
      }

      channel.on('postgres_changes', changeConfig, handlePayload);

      // Subscribe com callbacks de status
      channel
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ [Realtime] Subscrito com sucesso (${table})`);
            setIsConnected(true);
            setStatus('connected');
            setError(null);
            reconnectAttemptsRef.current = 0;
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ [Realtime] Erro no canal (${table}):`, err);
            setIsConnected(false);
            setStatus('error');
            setError(err || new Error('Canal error'));

            // Cleanup and attempt reconnect
            channelRef.current = null;

            if (reconnectAttemptsRef.current < REALTIME_CONFIG.maxReconnectAttempts) {
              reconnectAttemptsRef.current++;
              const delay = REALTIME_CONFIG.reconnectDelay * reconnectAttemptsRef.current;
              console.log(
                `🔄 [Realtime] Tentativa de reconexão ${reconnectAttemptsRef.current}/${REALTIME_CONFIG.maxReconnectAttempts} em ${delay}ms`
              );
              reconnectTimeoutRef.current = setTimeout(() => {
                connect();
              }, delay);
            } else {
              console.error(`❌ [Realtime] Máximo de tentativas de reconexão atingido para ${table}`);
            }
          } else if (status === 'TIMED_OUT') {
            console.warn(`⏱️ [Realtime] Timeout na conexão (${table})`);
            setIsConnected(false);
            setStatus('disconnected');
          } else if (status === 'CLOSED') {
            console.log(`🔒 [Realtime] Canal fechado (${table})`);
            setIsConnected(false);
            setStatus('disconnected');
          }
        });

      channelRef.current = channel;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      console.error(`❌ [Realtime] Erro ao conectar (${table}):`, error);
      setError(error);
      setStatus('error');
      setIsConnected(false);
    }
  }, [enabled, table, event, schema, filter, handlePayload]);

  useEffect(() => {
    connect();

    return () => {
      cleanup();
    };
  }, [connect, cleanup]);

  return {
    isConnected,
    status,
    error,
    lastEvent,
  };
}