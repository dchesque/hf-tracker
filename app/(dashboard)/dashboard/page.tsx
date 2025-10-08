'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign, TrendingUp, Briefcase, Award, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { RealtimeIndicator } from '@/components/shared/RealtimeIndicator';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { REALTIME_TABLES, REALTIME_EVENTS } from '@/lib/supabase/realtime-config';
import { toast } from 'sonner';

interface Metrics {
  totalInvested: number;
  pnlTotal: number;
  pnlPercentage: number;
  openPositions: number;
  bestPosition: {
    coin: string;
    pnl: number;
    roi: number;
  } | null;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics');
      const data = await res.json();
      setMetrics(data);
      console.log('✅ [Dashboard] Métricas atualizadas', data);
    } catch (error) {
      console.error('❌ [Dashboard] Error fetching metrics:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const { isConnected, status, lastEvent } = useRealtimeTable({
    table: REALTIME_TABLES.POSITIONS,
    event: REALTIME_EVENTS.ALL,
    onInsert: (payload) => {
      console.log('🔔 [Dashboard] Nova posição criada', payload.new);
      loadMetrics();
      toast.success('Nova posição aberta!', {
        id: 'position-insert',
        description: `Posição em ${(payload.new as any)?.coin || 'moeda'}`,
        duration: 2000,
      });
    },
    onUpdate: (payload) => {
      console.log('🔄 [Dashboard] Posição atualizada', payload.new);
      loadMetrics();
    },
    onDelete: (payload) => {
      console.log('🗑️ [Dashboard] Posição deletada', payload.old);
      loadMetrics();
    },
  });

  if (loading) {
    return (
      <div className="relative min-h-screen">
        {/* Abstract blur backgrounds */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/2 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/2 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-yellow-400/1 rounded-full blur-3xl"></div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-white">My</span>
              <span className="text-yellow-500"> Dashboard</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-base">
              Overview of your positions and performance
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-zinc-800/50 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isPnlPositive = (metrics?.pnlTotal || 0) >= 0;

  return (
    <div className="relative min-h-screen">
      {/* Abstract blur backgrounds */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/2 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/2 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-yellow-400/1 rounded-full blur-3xl"></div>
      </div>

      <div className="relative space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-white">My</span>
              <span className="text-yellow-500"> Dashboard</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-base">
              Overview of your positions and performance
            </p>
          </div>
          <RealtimeIndicator
            isConnected={isConnected}
            status={status}
            lastUpdate={lastEvent}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Invested Card */}
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Invested</p>
                  <p className="text-3xl font-bold mt-2 text-white">
                    {formatCurrency(metrics?.totalInvested || 0)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* P&L Total Card */}
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total P&L</p>
                  <p className={`text-3xl font-bold mt-2 ${isPnlPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(metrics?.pnlTotal || 0)}
                  </p>
                  <p className={`text-sm mt-1 ${isPnlPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage((metrics?.pnlPercentage || 0) / 100)}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full ${isPnlPositive ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-center`}>
                  {isPnlPositive ? (
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Positions Card */}
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Open Positions</p>
                  <p className="text-3xl font-bold mt-2 text-white">
                    {metrics?.openPositions || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Position Card */}
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Best Position</p>
                  <p className="text-2xl font-bold mt-2 text-yellow-400 font-mono">
                    {metrics?.bestPosition
                      ? `${metrics.bestPosition.coin}`
                      : "-"}
                  </p>
                  {metrics?.bestPosition && (
                    <p className="text-sm mt-1 text-green-400">
                      {formatPercentage(metrics.bestPosition.roi / 100)}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">P&L Evolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-zinc-500">
                Chart will be implemented with snapshot data
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">Top 5 Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-zinc-500">
                {metrics?.openPositions === 0
                  ? "No open positions"
                  : "Position list will be implemented"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}