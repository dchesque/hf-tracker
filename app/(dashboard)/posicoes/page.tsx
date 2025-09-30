'use client';

import { useEffect, useState, useCallback } from 'react';
import { PositionCard } from '@/components/positions/PositionCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { RealtimeIndicator } from '@/components/shared/RealtimeIndicator';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { REALTIME_TABLES, REALTIME_EVENTS } from '@/lib/supabase/realtime-config';
import { toast } from 'sonner';

interface Position {
  id: string;
  coinSymbol: string;
  status: string;
  totalCapital: number;
  shortEntryFundingRate: number;
  fundingAccumulated: number;
  tradingFees: number;
  pnlNet: number;
  pnlPercentage: number;
  openedAt: Date;
  coin: {
    symbol: string;
    name: string;
  };
  snapshots: Array<{
    currentFundingRate: number;
  }>;
  alerts: Array<any>;
}

export default function PosicoesPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    try {
      const status = statusFilter === 'all' ? '' : statusFilter;
      const url = status ? `/api/positions?status=${status}` : '/api/positions';

      const res = await fetch(url);
      const data = await res.json();
      setPositions(Array.isArray(data) ? data : []);
      console.log(`✅ [Posições] Dados atualizados: ${Array.isArray(data) ? data.length : 0} posições carregadas`);
    } catch (error) {
      console.error('❌ [Posições] Error fetching positions:', error);
      toast.error('Erro ao carregar posições');
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  const { isConnected, status, lastEvent } = useRealtimeTable({
    table: REALTIME_TABLES.POSITIONS,
    event: REALTIME_EVENTS.ALL,
    filter: statusFilter !== 'all' ? `status=eq.${statusFilter}` : undefined,
    onInsert: (payload) => {
      console.log('🔔 [Posições] Nova posição criada', payload.new);
      loadPositions();
      const coin = (payload.new as any)?.coin_symbol || 'moeda';
      toast.success(`Nova posição aberta: ${coin}`, {
        id: `position-insert-${(payload.new as any)?.id}`,
        duration: 2000,
      });
      setHighlightedId((payload.new as any)?.id);
      setTimeout(() => setHighlightedId(null), 2000);
    },
    onUpdate: (payload) => {
      console.log('🔄 [Posições] Posição atualizada', payload.new);
      loadPositions();
      setHighlightedId((payload.new as any)?.id);
      setTimeout(() => setHighlightedId(null), 2000);
    },
    onDelete: (payload) => {
      console.log('🗑️ [Posições] Posição deletada', payload.old);
      loadPositions();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Posições</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas posições abertas e fechadas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeIndicator
            isConnected={isConnected}
            status={status}
            lastUpdate={lastEvent}
          />
          <Button className="gap-2">
            <Plus size={18} />
            Nova Posição
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'open' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('open')}
          size="sm"
        >
          Abertas
        </Button>
        <Button
          variant={statusFilter === 'closed' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('closed')}
          size="sm"
        >
          Fechadas
        </Button>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
          size="sm"
        >
          Todas
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : positions.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground text-lg">
                Nenhuma posição encontrada
              </div>
              <p className="text-sm text-muted-foreground">
                Comece abrindo sua primeira posição na aba Oportunidades
              </p>
              <Button className="gap-2">
                <Plus size={18} />
                Abrir Primeira Posição
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((position) => (
            <div
              key={position.id}
              className={`transition-all ${
                highlightedId === position.id
                  ? 'ring-2 ring-green-500 rounded-lg animate-pulse'
                  : ''
              }`}
            >
              <PositionCard position={position} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}