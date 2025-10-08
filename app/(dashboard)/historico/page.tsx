'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatPercentage, formatDateTime } from '@/lib/utils';
import { Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { RealtimeIndicator } from '@/components/shared/RealtimeIndicator';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { REALTIME_TABLES, REALTIME_EVENTS } from '@/lib/supabase/realtime-config';
import { toast } from 'sonner';

interface Position {
  id: string;
  coinSymbol: string;
  totalCapital: number;
  pnlNet: number;
  pnlPercentage: number;
  openedAt: Date;
  closedAt: Date;
}

export default function HistoricoPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    try {
      const res = await fetch('/api/positions?status=closed');
      const data = await res.json();
      setPositions(Array.isArray(data) ? data : []);
      console.log(`✅ [Histórico] Dados atualizados: ${Array.isArray(data) ? data.length : 0} posições fechadas`);
    } catch (error) {
      console.error('❌ [Histórico] Error fetching history:', error);
      toast.error('Erro ao carregar histórico');
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  const { isConnected, status, lastEvent } = useRealtimeTable({
    table: REALTIME_TABLES.POSITIONS,
    event: REALTIME_EVENTS.UPDATE,
    filter: 'status=eq.closed',
    onUpdate: (payload) => {
      console.log('🔔 [Histórico] Nova posição fechada', payload.new);
      const coin = (payload.new as any)?.coin_symbol || 'moeda';
      const pnl = (payload.new as any)?.pnl_net || 0;
      const isProfitable = Number(pnl) >= 0;

      loadPositions();
      toast.success(`Posição fechada: ${coin}`, {
        id: `position-closed-${(payload.new as any)?.id}`,
        description: `P&L: ${formatCurrency(Number(pnl))}`,
        className: isProfitable ? 'bg-green-950' : 'bg-red-950',
        duration: 2000,
      });

      setHighlightedId((payload.new as any)?.id);
      setTimeout(() => setHighlightedId(null), 3000);
    },
  });

  const stats = useMemo(() => {
    if (!Array.isArray(positions)) {
      return { totalTrades: 0, winRate: 0, bestTrade: null, worstTrade: null, totalProfit: 0 };
    }

    const totalTrades = positions.length;
    const profitableTrades = positions.filter((p) => Number(p.pnlNet) >= 0).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

    const bestTrade =
      positions.length > 0
        ? positions.reduce((best, current) =>
            Number(current.pnlNet) > Number(best.pnlNet) ? current : best
          )
        : null;

    const worstTrade =
      positions.length > 0
        ? positions.reduce((worst, current) =>
            Number(current.pnlNet) < Number(worst.pnlNet) ? current : worst
          )
        : null;

    const totalProfit = positions.reduce((sum, p) => sum + Number(p.pnlNet), 0);

    return { totalTrades, winRate, bestTrade, worstTrade, totalProfit };
  }, [positions]);

  const calculateDuration = (opened: Date, closed: Date) => {
    const diff = new Date(closed).getTime() - new Date(opened).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

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
              <span className="text-white">Trade</span>
              <span className="text-yellow-500"> History</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-base">
              View and analyze your closed positions
            </p>
          </div>
          <RealtimeIndicator
            isConnected={isConnected}
            status={status}
            lastUpdate={lastEvent}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-400">Total Trades</p>
              <p className="text-3xl font-bold mt-2 text-white">{stats.totalTrades}</p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-400">Win Rate</p>
              <p className="text-3xl font-bold mt-2 text-green-400">
                {stats.winRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-400">Best Trade</p>
              <p className="text-2xl font-bold mt-2 text-green-400">
                {stats.bestTrade ? formatCurrency(Number(stats.bestTrade.pnlNet)) : '-'}
              </p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-400">Worst Trade</p>
              <p className="text-2xl font-bold mt-2 text-red-400">
                {stats.worstTrade ? formatCurrency(Number(stats.worstTrade.pnlNet)) : '-'}
              </p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50 hover:border-yellow-500/20 transition-all duration-300">
            <CardContent className="p-6">
              <p className="text-sm text-zinc-400">Total Profit</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {formatCurrency(stats.totalProfit)}
              </p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-32">
                <div className="text-zinc-400">Loading...</div>
              </div>
            </CardContent>
          </Card>
        ) : positions.length === 0 ? (
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-12">
              <div className="text-center space-y-4">
                <div className="text-zinc-400 text-lg">No closed positions</div>
                <p className="text-sm text-zinc-500">
                  Your closed positions will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
            <CardHeader>
              <CardTitle className="text-white">Closed Positions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-zinc-400">Coin</TableHead>
                      <TableHead className="text-zinc-400">Opened</TableHead>
                      <TableHead className="text-zinc-400">Closed</TableHead>
                      <TableHead className="text-zinc-400">Duration</TableHead>
                      <TableHead className="text-zinc-400">Capital</TableHead>
                      <TableHead className="text-zinc-400">Final P&L</TableHead>
                      <TableHead className="text-zinc-400">ROI</TableHead>
                      <TableHead className="text-zinc-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => {
                      const isProfitable = Number(position.pnlNet) >= 0;
                      const isHighlighted = highlightedId === position.id;
                      return (
                        <TableRow
                          key={position.id}
                          className={`hover:bg-zinc-800/30 transition-colors ${
                            isHighlighted
                              ? isProfitable
                                ? 'bg-green-950/30 animate-pulse'
                                : 'bg-red-950/30 animate-pulse'
                              : ''
                          }`}
                        >
                          <TableCell className="font-mono font-bold text-white">
                            {position.coinSymbol}
                          </TableCell>
                          <TableCell className="text-sm text-zinc-400">
                            {formatDateTime(new Date(position.openedAt)).split(' ')[0]}
                          </TableCell>
                          <TableCell className="text-sm text-zinc-400">
                            {formatDateTime(new Date(position.closedAt)).split(' ')[0]}
                          </TableCell>
                          <TableCell className="text-sm text-zinc-400">
                            {calculateDuration(position.openedAt, position.closedAt)}
                          </TableCell>
                          <TableCell className="text-zinc-300">{formatCurrency(Number(position.totalCapital))}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold ${
                                  isProfitable ? 'text-green-400' : 'text-red-400'
                                }`}
                              >
                                {formatCurrency(Number(position.pnlNet))}
                              </span>
                              {isProfitable ? (
                                <TrendingUp className="text-green-400" size={16} />
                              ) : (
                                <TrendingDown className="text-red-400" size={16} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isProfitable ? 'success' : 'destructive'} className={isProfitable ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                              {formatPercentage(Number(position.pnlPercentage) / 100)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="hover:bg-zinc-800/60 hover:text-yellow-500">
                              <Eye size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}