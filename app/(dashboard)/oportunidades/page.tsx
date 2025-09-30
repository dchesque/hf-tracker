'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FundingBadge } from '@/components/shared/FundingBadge';
import { RealtimeIndicator } from '@/components/shared/RealtimeIndicator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatLargeNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import { Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { REALTIME_TABLES, REALTIME_EVENTS } from '@/lib/supabase/realtime-config';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface FundingRateData {
  coin: string;
  hyperliquid_oi: number;
  hyperliquid_rate: number;
  binance_rate: number | null;
  bybit_rate: number | null;
  binance_hl_arb: number | null;
  bybit_hl_arb: number | null;
  scraped_at: string;
}

type TimePeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

type SortField = 'coin' | 'hyperliquid_oi' | 'hyperliquid_rate' | 'binance_rate' | 'bybit_rate' | 'binance_hl_arb' | 'bybit_hl_arb';
type SortDirection = 'asc' | 'desc';

// Valores no banco são POR HORA
const TIME_PERIOD_MULTIPLIERS: Record<TimePeriod, number> = {
  hour: 1,      // Base: 1 hora
  day: 24,      // 24 horas
  week: 168,    // 24 * 7
  month: 720,   // 24 * 30
  year: 8760,   // 24 * 365
};

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  hour: 'Hora',
  day: 'Dia',
  week: 'Semana',
  month: 'Mês',
  year: 'Ano',
};

export default function OportunidadesPage() {
  const [opportunities, setOpportunities] = useState<FundingRateData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('year');
  const [sortField, setSortField] = useState<SortField>('hyperliquid_rate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [lastScrapedAt, setLastScrapedAt] = useState<string | null>(null);

  const loadFundingRates = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_latest_funding_rates');

      if (error) {
        console.error('❌ [Oportunidades] Error fetching funding rates:', error);
        toast.error('Erro ao carregar funding rates');
        return;
      }

      // Não ordenar aqui, vamos ordenar no useMemo após aplicar o multiplicador
      setOpportunities(data || []);
      console.log(`✅ [Oportunidades] Dados atualizados: ${(data || []).length} moedas carregadas`);

      // Buscar último scraping metadata
      const metadataRes = await fetch('/api/scraping-metadata');
      if (metadataRes.ok) {
        const metadata = await metadataRes.json();
        setLastScrapedAt(metadata.created_at);
      }
    } catch (error) {
      console.error('❌ [Oportunidades] Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFundingRates();
  }, []);

  const { isConnected, status, lastEvent } = useRealtimeTable<FundingRateData>({
    table: REALTIME_TABLES.FUNDING_RATES,
    event: REALTIME_EVENTS.INSERT,
    onInsert: (payload) => {
      console.log('🔔 [Oportunidades] Novos funding rates inseridos');
      loadFundingRates();
      toast.success('Funding rates atualizados!', {
        description: 'Novos dados disponíveis',
      });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to desc
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const topOpportunities = useMemo(() => {
    // Valores já vêm como taxa POR HORA do banco
    // Não precisa multiplicar, apenas ordenar
    return opportunities
      .sort((a, b) => Number(b.hyperliquid_rate) - Number(a.hyperliquid_rate))
      .slice(0, 4);
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    const multiplier = TIME_PERIOD_MULTIPLIERS[timePeriod];

    const filtered = searchTerm
      ? opportunities.filter((opp) =>
          opp.coin.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : opportunities;

    const withMultiplier = filtered.map((opp) => ({
      ...opp,
      hyperliquid_rate: opp.hyperliquid_rate * multiplier,
      binance_rate: opp.binance_rate !== null ? opp.binance_rate * multiplier : null,
      bybit_rate: opp.bybit_rate !== null ? opp.bybit_rate * multiplier : null,
      binance_hl_arb: opp.binance_hl_arb !== null ? opp.binance_hl_arb * multiplier : null,
      bybit_hl_arb: opp.bybit_hl_arb !== null ? opp.bybit_hl_arb * multiplier : null,
    }));

    // Sort based on selected field and direction
    return withMultiplier.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null values (put them at the end)
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      // For string comparison (coin)
      if (sortField === 'coin') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // For numeric comparison
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [opportunities, searchTerm, timePeriod, sortField, sortDirection]);

  const calculateReturns = (hourlyRate: number, investment: number = 1000) => {
    // hourlyRate já é a taxa por hora (valor do banco de dados)
    // Retorno em valor absoluto por hora (50% do capital exposto)
    const hourlyReturn = investment * 0.5 * hourlyRate;

    // Retornos por período (acumulados)
    const hourly = hourlyReturn;
    const sixHours = hourlyReturn * 6;
    const twelveHours = hourlyReturn * 12;
    const daily = hourlyReturn * 24;
    const weekly = hourlyReturn * 24 * 7;
    const monthly = hourlyReturn * 24 * 30;
    const yearly = hourlyReturn * 24 * 365;

    return { hourly, sixHours, twelveHours, daily, weekly, monthly, yearly };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Oportunidades</h1>
          <p className="text-gray-400 mt-1">
            Melhores oportunidades de funding rate arbitrage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeIndicator
            isConnected={isConnected}
            status={status}
            lastUpdate={lastEvent}
          />
          {lastScrapedAt && (
            <div
              className="text-sm text-gray-400 cursor-help"
              title={`UTC: ${new Date(lastScrapedAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'UTC'
              })}`}
            >
              Última atualização:{' '}
              <span className="font-semibold text-gray-300">
                {new Date(lastScrapedAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZone: 'America/Sao_Paulo'
                })}{' '}
                🇧🇷 <span className="text-xs text-gray-500">(GMT-3)</span>
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadFundingRates}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Top 4 Opportunities Cards */}
      {!isLoading && topOpportunities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topOpportunities.map((opp, index) => {
            // opp.hyperliquid_rate já é por HORA (valor do banco)
            const returns = calculateReturns(opp.hyperliquid_rate, 1000);
            const yearlyRate = opp.hyperliquid_rate * TIME_PERIOD_MULTIPLIERS['year'];

            return (
              <Card key={opp.coin} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  TOP {index + 1}
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold font-mono">{opp.coin}</h3>
                    <p className="text-xs text-gray-500">Taxa Anual</p>
                    <div className="text-3xl font-bold text-green-500 mt-1">
                      {formatPercentage(yearlyRate)}
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-xs text-gray-400 mb-1">Simulação com $1000 (50% exposto)</p>
                    <div className="text-lg font-semibold text-green-400">
                      {formatCurrency(returns.yearly)}
                    </div>
                    <p className="text-xs text-gray-500">Retorno anual estimado</p>
                  </div>

                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-xs text-gray-400 mb-2">Retorno com $1000:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">1h:</span>
                        <span className="ml-1 font-semibold text-green-400">
                          {formatCurrency(returns.hourly)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">6h:</span>
                        <span className="ml-1 font-semibold text-green-400">
                          {formatCurrency(returns.sixHours)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">12h:</span>
                        <span className="ml-1 font-semibold text-green-400">
                          {formatCurrency(returns.twelveHours)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">24h:</span>
                        <span className="ml-1 font-semibold text-green-400">
                          {formatCurrency(returns.daily)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">7d:</span>
                        <span className="ml-1 font-semibold text-green-400">
                          {formatCurrency(returns.weekly)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">30d:</span>
                        <span className="ml-1 font-semibold text-green-400">
                          {formatCurrency(returns.monthly)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                placeholder="Buscar moeda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={timePeriod === 'hour' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('hour')}
              >
                Hora
              </Button>
              <Button
                variant={timePeriod === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('day')}
              >
                Dia
              </Button>
              <Button
                variant={timePeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('week')}
              >
                Semana
              </Button>
              <Button
                variant={timePeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('month')}
              >
                Mês
              </Button>
              <Button
                variant={timePeriod === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('year')}
              >
                Ano
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="text-gray-400 text-lg">Carregando oportunidades...</div>
            </div>
          </CardContent>
        </Card>
      ) : filteredOpportunities.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="text-gray-400 text-lg">
                {searchTerm
                  ? `Nenhuma moeda encontrada para "${searchTerm}"`
                  : 'Nenhuma oportunidade encontrada'}
              </div>
              {!searchTerm && (
                <p className="text-sm text-gray-500">
                  Aguardando dados de funding rates do sistema de scraping
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-800/50"
                      onClick={() => handleSort('coin')}
                    >
                      <div className="flex items-center">
                        Coin
                        {getSortIcon('coin')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-gray-800/50"
                      onClick={() => handleSort('hyperliquid_oi')}
                    >
                      <div className="flex items-center justify-end">
                        Hyperliquid OI
                        {getSortIcon('hyperliquid_oi')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-gray-800/50"
                      onClick={() => handleSort('hyperliquid_rate')}
                    >
                      <div className="flex items-center justify-end">
                        Hyperliquid ({TIME_PERIOD_LABELS[timePeriod]})
                        {getSortIcon('hyperliquid_rate')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-gray-800/50"
                      onClick={() => handleSort('binance_rate')}
                    >
                      <div className="flex items-center justify-end">
                        Binance ({TIME_PERIOD_LABELS[timePeriod]})
                        {getSortIcon('binance_rate')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-gray-800/50"
                      onClick={() => handleSort('bybit_rate')}
                    >
                      <div className="flex items-center justify-end">
                        Bybit ({TIME_PERIOD_LABELS[timePeriod]})
                        {getSortIcon('bybit_rate')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-gray-800/50"
                      onClick={() => handleSort('binance_hl_arb')}
                    >
                      <div className="flex items-center justify-end">
                        Binance-HL Arb ({TIME_PERIOD_LABELS[timePeriod]})
                        {getSortIcon('binance_hl_arb')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-gray-800/50"
                      onClick={() => handleSort('bybit_hl_arb')}
                    >
                      <div className="flex items-center justify-end">
                        Bybit-HL Arb ({TIME_PERIOD_LABELS[timePeriod]})
                        {getSortIcon('bybit_hl_arb')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.map((opp, index) => (
                    <TableRow key={opp.coin} className="hover:bg-gray-900/50">
                      <TableCell className="text-center font-bold text-gray-400">
                        #{index + 1}
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        {opp.coin}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatLargeNumber(Number(opp.hyperliquid_oi))}
                      </TableCell>
                      <TableCell className="text-right">
                        <FundingBadge
                          rate={Number(opp.hyperliquid_rate)}
                          showIcon={false}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {opp.binance_rate !== null ? (
                          <FundingBadge
                            rate={Number(opp.binance_rate)}
                            showIcon={false}
                          />
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {opp.bybit_rate !== null ? (
                          <FundingBadge
                            rate={Number(opp.bybit_rate)}
                            showIcon={false}
                          />
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {opp.binance_hl_arb !== null ? (
                          <FundingBadge
                            rate={Number(opp.binance_hl_arb)}
                            showIcon={false}
                          />
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {opp.bybit_hl_arb !== null ? (
                          <FundingBadge
                            rate={Number(opp.bybit_hl_arb)}
                            showIcon={false}
                          />
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredOpportunities.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Mostrando {filteredOpportunities.length} moeda(s) • Última atualização:{' '}
          {new Date(filteredOpportunities[0].scraped_at).toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
}