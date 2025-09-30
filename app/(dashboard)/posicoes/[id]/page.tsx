'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FundingBadge } from '@/components/shared/FundingBadge';
import { RealtimeIndicator } from '@/components/shared/RealtimeIndicator';
import { formatCurrency, formatPercentage, formatDateTime } from '@/lib/utils';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { REALTIME_TABLES, REALTIME_EVENTS } from '@/lib/supabase/realtime-config';
import { toast } from 'sonner';

interface Position {
  id: string;
  coinSymbol: string;
  status: string;
  totalCapital: number;
  shortAmount: number;
  shortEntryPrice: number;
  shortSize: number;
  shortEntryFundingRate: number;
  spotAmount: number;
  spotExchange: string;
  spotEntryPrice: number;
  spotQuantity: number;
  tradingFees: number;
  fundingAccumulated: number;
  pnlNet: number;
  pnlPercentage: number;
  openedAt: Date;
  notes: string | null;
  snapshots: Array<{
    currentFundingRate: number;
    fundingAccumulated: number;
    pnlNet: number;
    snapshotAt: Date;
  }>;
  alerts: Array<any>;
}

export default function PositionDetailPage() {
  const params = useParams();
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const loadPosition = useCallback(async () => {
    try {
      const res = await fetch(`/api/positions/${params.id}`);
      const data = await res.json();
      setPosition(data);
      console.log(`✅ [Position Detail] Dados atualizados para ${data.coinSymbol}`);
    } catch (error) {
      console.error('❌ [Position Detail] Error fetching position:', error);
      toast.error('Erro ao carregar posição');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadPosition();
  }, [loadPosition]);

  // Realtime para updates na posição específica
  const positionRealtime = useRealtimeTable({
    table: REALTIME_TABLES.POSITIONS,
    event: REALTIME_EVENTS.UPDATE,
    filter: `id=eq.${params.id}`,
    onUpdate: (payload) => {
      console.log('🔄 [Position Detail] Posição atualizada', payload.new);
      loadPosition();
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    },
  });

  // Realtime para novos snapshots
  const snapshotsRealtime = useRealtimeTable({
    table: REALTIME_TABLES.POSITION_SNAPSHOTS,
    event: REALTIME_EVENTS.INSERT,
    filter: `position_id=eq.${params.id}`,
    onInsert: (payload) => {
      console.log('📊 [Position Detail] Novo snapshot criado', payload.new);
      loadPosition();
      toast.info('Snapshot atualizado');
    },
  });

  // Realtime para novos alertas
  const alertsRealtime = useRealtimeTable({
    table: REALTIME_TABLES.POSITION_ALERTS,
    event: REALTIME_EVENTS.INSERT,
    filter: `position_id=eq.${params.id}`,
    onInsert: (payload) => {
      console.log('🔔 [Position Detail] Novo alerta criado', payload.new);
      loadPosition();
      const alertType = (payload.new as any)?.alert_type || 'Alerta';
      toast.error(`Novo alerta: ${alertType}`, {
        description: (payload.new as any)?.message || 'Verifique a posição',
      });
    },
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Posição não encontrada</p>
            <Link href="/posicoes">
              <Button className="mt-4">Voltar para Posições</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentRate =
    position.snapshots.length > 0
      ? position.snapshots[0].currentFundingRate
      : position.shortEntryFundingRate;
  const isOpen = position.status === 'open';
  const isProfitable = Number(position.pnlNet) >= 0;

  // Verificar qual realtime está conectado (prioridade: posição > snapshots > alertas)
  const realtimeStatus = positionRealtime.isConnected
    ? positionRealtime
    : snapshotsRealtime.isConnected
    ? snapshotsRealtime
    : alertsRealtime;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/posicoes">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Posição {position.coinSymbol}</h1>
            <p className="text-muted-foreground mt-1">
              Aberto em {formatDateTime(new Date(position.openedAt))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeIndicator
            isConnected={realtimeStatus.isConnected}
            status={realtimeStatus.status}
            lastUpdate={realtimeStatus.lastEvent}
          />
          <Badge variant={isOpen ? 'success' : 'outline'}>
            {isOpen ? 'Aberta' : 'Fechada'}
          </Badge>
        </div>
      </div>

      <div className={`grid gap-6 md:grid-cols-4 ${isAnimating ? 'animate-pulse' : ''}`}>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Capital Total</p>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(Number(position.totalCapital))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Entry Rate</p>
            <div className="mt-2">
              <FundingBadge rate={Number(position.shortEntryFundingRate)} showIcon={false} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Current Rate</p>
            <div className="mt-2">
              <FundingBadge rate={Number(currentRate)} showIcon={false} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-2xl font-bold mt-2">{isOpen ? 'Ativa' : 'Fechada'}</p>
          </CardContent>
        </Card>
      </div>

      <div className={`grid gap-6 md:grid-cols-4 ${isAnimating ? 'animate-pulse' : ''}`}>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Funding Acumulado</p>
            <p className="text-2xl font-bold mt-2 text-success">
              {formatCurrency(Number(position.fundingAccumulated))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Taxas Pagas</p>
            <p className="text-2xl font-bold mt-2 text-destructive">
              -{formatCurrency(Number(position.tradingFees))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">P&L Líquido</p>
            <p
              className={`text-2xl font-bold mt-2 ${
                isProfitable ? 'text-success' : 'text-destructive'
              }`}
            >
              {formatCurrency(Number(position.pnlNet))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">ROI</p>
            <div className="flex items-center gap-2 mt-2">
              <p
                className={`text-2xl font-bold ${
                  isProfitable ? 'text-success' : 'text-destructive'
                }`}
              >
                {formatPercentage(Number(position.pnlPercentage) / 100)}
              </p>
              {isProfitable ? (
                <TrendingUp className="text-success" size={20} />
              ) : (
                <TrendingDown className="text-destructive" size={20} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SHORT Hyperliquid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Exchange:</span>
              <span className="font-medium">Hyperliquid</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <span className="font-medium">Perpétuo (Short)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-medium">{formatCurrency(Number(position.shortAmount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Preço Entrada:</span>
              <span className="font-medium">
                {formatCurrency(Number(position.shortEntryPrice))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tamanho:</span>
              <span className="font-medium">
                {Number(position.shortSize).toFixed(8)} {position.coinSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Funding Rate:</span>
              <FundingBadge rate={Number(currentRate)} showIcon={false} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SPOT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Exchange:</span>
              <span className="font-medium">{position.spotExchange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <span className="font-medium">Spot (Long)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-medium">{formatCurrency(Number(position.spotAmount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Preço Compra:</span>
              <span className="font-medium">
                {formatCurrency(Number(position.spotEntryPrice))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Quantidade:</span>
              <span className="font-medium">
                {Number(position.spotQuantity).toFixed(8)} {position.coinSymbol}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {position.alerts && position.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alertas ({position.alerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {position.alerts.map((alert: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-destructive/10 border border-destructive/20 rounded-md"
                >
                  <p className="text-sm font-medium text-destructive">{alert.alert_type}</p>
                  {alert.message && (
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {position.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{position.notes}</p>
          </CardContent>
        </Card>
      )}

      {isOpen && (
        <div className="flex justify-end">
          <Button variant="destructive" size="lg">
            Fechar Posição
          </Button>
        </div>
      )}
    </div>
  );
}