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
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';

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
    <div className="relative min-h-screen">
      {/* Abstract blur backgrounds */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/2 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/2 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-yellow-400/1 rounded-full blur-3xl"></div>
      </div>

      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-white">My</span>
              <span className="text-yellow-500"> Positions</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-base">
              Manage your open and closed positions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RealtimeIndicator
              isConnected={isConnected}
              status={status}
              lastUpdate={lastEvent}
            />
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <Button
                            onClick={openConnectModal}
                            className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                          >
                            <Wallet size={18} />
                            Connect Wallet
                          </Button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <Button
                            onClick={openChainModal}
                            className="gap-2 bg-red-500 hover:bg-red-600 text-white font-medium"
                          >
                            Wrong Network
                          </Button>
                        );
                      }

                      return (
                        <div className="flex gap-2">
                          <Button
                            onClick={openChainModal}
                            variant="outline"
                            className="gap-2 border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500 hover:border-yellow-500/30 transition-colors"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 18,
                                  height: 18,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 18, height: 18 }}
                                  />
                                )}
                              </div>
                            )}
                            {chain.name}
                          </Button>

                          <Button
                            onClick={openAccountModal}
                            className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                          >
                            <Wallet size={18} />
                            {account.displayName}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
            <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
              <Plus size={18} />
              New Position
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('open')}
            size="sm"
            className={statusFilter === 'open' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500 hover:border-yellow-500/30 transition-colors'}
          >
            Open
          </Button>
          <Button
            variant={statusFilter === 'closed' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('closed')}
            size="sm"
            className={statusFilter === 'closed' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500 hover:border-yellow-500/30 transition-colors'}
          >
            Closed
          </Button>
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
            className={statusFilter === 'all' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500 hover:border-yellow-500/30 transition-colors'}
          >
            All
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-64 bg-zinc-800/50 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : positions.length === 0 ? (
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-12">
              <div className="text-center space-y-4">
                <div className="text-zinc-400 text-lg">
                  No positions found
                </div>
                <p className="text-sm text-zinc-500">
                  Start by opening your first position in the Opportunities tab
                </p>
                <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus size={18} />
                  Open First Position
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
                    ? 'ring-2 ring-yellow-500 rounded-lg animate-pulse'
                    : ''
                }`}
              >
                <PositionCard position={position} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}