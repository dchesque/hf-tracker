'use client';

import { Card } from '@/components/ui/card';
import { RealtimeIndicator } from '@/components/shared/RealtimeIndicator';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { REALTIME_TABLES, REALTIME_EVENTS } from '@/lib/supabase/realtime-config';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  // Placeholder: escutar mudanças em user_settings quando implementado
  const { isConnected, status, lastEvent } = useRealtimeTable({
    table: REALTIME_TABLES.USER_SETTINGS,
    event: REALTIME_EVENTS.UPDATE,
    enabled: false, // Desabilitado até implementar user_settings
    onUpdate: (payload) => {
      console.log('🔔 [Configurações] Settings atualizados', payload.new);
      toast.info('Configurações sincronizadas', {
        description: 'Alterações detectadas em outro dispositivo',
      });
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Personalize o comportamento do sistema
          </p>
        </div>
        {/* Mostrar indicador quando user_settings for implementado */}
        {/* <RealtimeIndicator
          isConnected={isConnected}
          status={status}
          lastUpdate={lastEvent}
        /> */}
      </div>

      <Card className="flex items-center justify-center h-[400px] text-muted-foreground">
        Página em desenvolvimento
      </Card>
    </div>
  );
}