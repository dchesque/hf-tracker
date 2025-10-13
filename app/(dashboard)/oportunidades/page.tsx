'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FundingBadge } from '@/components/shared/FundingBadge';
import { RealtimeIndicator } from '@/components/shared/RealtimeIndicator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatLargeNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import { Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Rocket, ExternalLink, ChevronRight, ChevronDown, Eye, EyeOff, Plus } from 'lucide-react';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { REALTIME_TABLES, REALTIME_EVENTS } from '@/lib/supabase/realtime-config';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StarBorder } from '@/components/ui/star-border';
import Link from 'next/link';
import { FundingRatesSkeleton, TopOpportunitiesSkeleton } from '@/components/FundingRatesSkeleton';

interface FundingRateData {
  coin: string;
  hyperliquid_oi: number;
  hyperliquid_rate: number;
  binance_rate: number | null;
  bybit_rate: number | null;
  binance_hl_arb: number | null;
  bybit_hl_arb: number | null;
  scraped_at: string;
  avg_24h?: number | null;
  avg_7d?: number | null;
  avg_30d?: number | null;
}

type TimePeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

type SortField = 'coin' | 'hyperliquid_oi' | 'hyperliquid_rate' | 'binance_rate' | 'bybit_rate' | 'binance_hl_arb' | 'bybit_hl_arb' | 'avg_24h' | 'avg_7d' | 'avg_30d';
type SortDirection = 'asc' | 'desc';

// Função para gerar URL de busca do CoinGecko no Google
const getCoinGeckoSearchUrl = (symbol: string): string => {
  const query = encodeURIComponent(`Coingecko $${symbol.toUpperCase()}`);
  return `https://www.google.com/search?q=${query}`;
};

// Função para gerar URL da Hyperliquid
const getHyperliquidUrl = (symbol: string): string => {
  return `https://app.hyperliquid.xyz/trade/${symbol}`;
};

// Valores no banco são POR HORA
const TIME_PERIOD_MULTIPLIERS: Record<TimePeriod, number> = {
  hour: 1,      // Base: 1 hora
  day: 24,      // 24 horas
  week: 168,    // 24 * 7
  month: 720,   // 24 * 30
  year: 8760,   // 24 * 365
};

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  hour: 'Hour',
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
};

export default function OportunidadesPage() {
  const [opportunities, setOpportunities] = useState<FundingRateData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('year');
  const [sortField, setSortField] = useState<SortField>('hyperliquid_rate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [lastScrapedAt, setLastScrapedAt] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const updateCountRef = useRef(0);
  const [showHistoricalColumns, setShowHistoricalColumns] = useState(true);
  const [showOnlyHyperliquid, setShowOnlyHyperliquid] = useState(false);

  // Carrega o batch inicial de moedas (top 30)
  const loadInitialBatch = async () => {
    try {
      setIsInitialLoading(true);
      setLoadingError(null);
      const supabase = createClient();

      console.log('📊 [Oportunidades] Carregando batch inicial...');

      // Buscar primeiras 30 moedas ordenadas por OI
      const { data: fundingData, error: fundingError } = await supabase.rpc('get_latest_funding_rates');

      if (fundingError) {
        console.error('❌ [Oportunidades] Error fetching funding rates:', fundingError);
        setLoadingError('Erro ao carregar funding rates');
        toast.error('Erro ao carregar funding rates');
        return;
      }

      // Pegar apenas top 30 para renderização inicial
      const initialBatch = (fundingData || []).slice(0, 30);
      const total = (fundingData || []).length;

      setOpportunities(initialBatch);
      setTotalCount(total);
      setCurrentBatch(1);
      setHasMore(total > 30);

      console.log(`✅ [Oportunidades] Batch inicial carregado: ${initialBatch.length}/${total} moedas`);

      // Buscar último scraping metadata
      const metadataRes = await fetch('/api/scraping-metadata');
      if (metadataRes.ok) {
        const metadata = await metadataRes.json();
        setLastScrapedAt(metadata.created_at);
      }

      // Carregar resto dos dados em background
      if (total > 30) {
        loadRemainingData(fundingData);
      }

      // Carregar médias históricas em paralelo (não bloqueante)
      loadHistoricalAverages(fundingData);
    } catch (error) {
      console.error('❌ [Oportunidades] Erro ao carregar batch inicial:', error);
      setLoadingError('Erro ao carregar dados');
      toast.error('Erro ao carregar dados');
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Carrega os dados restantes em batches progressivos
  const loadRemainingData = async (allData: FundingRateData[]) => {
    setIsLoadingMore(true);
    const BATCH_SIZE = 30;
    let offset = 30;

    while (offset < allData.length) {
      // Aguardar 500ms entre batches para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));

      const nextBatch = allData.slice(offset, offset + BATCH_SIZE);

      setOpportunities(prev => [...prev, ...nextBatch]);
      setCurrentBatch(prev => prev + 1);

      console.log(`✅ [Oportunidades] Batch ${Math.floor(offset / BATCH_SIZE) + 1} carregado: ${offset + nextBatch.length}/${allData.length}`);

      offset += BATCH_SIZE;
    }

    setHasMore(false);
    setIsLoadingMore(false);
    console.log(`✅ [Oportunidades] Todos os dados carregados: ${allData.length} moedas`);
  };

  // Carrega médias históricas de forma assíncrona
  const loadHistoricalAverages = async (coins: FundingRateData[]) => {
    try {
      const supabase = createClient();

      console.log('📈 [Oportunidades] Carregando médias históricas...');

      // Buscar médias históricas
      const { data: avgData, error: avgError } = await supabase.rpc('get_historical_averages_hybrid');

      if (avgError) {
        console.error('❌ [Oportunidades] Error fetching historical averages:', avgError);
        return;
      }

      // Atualizar oportunidades com médias históricas
      setOpportunities(prev => prev.map(opp => {
        const avg = avgData?.find((a: any) => a.coin === opp.coin);
        if (avg) {
          return {
            ...opp,
            avg_24h: avg.avg_24h || null,
            avg_7d: avg.avg_7d || null,
            avg_30d: avg.avg_30d || null,
          };
        }
        return opp;
      }));

      console.log(`✅ [Oportunidades] Médias históricas carregadas`);
    } catch (error) {
      console.error('❌ [Oportunidades] Erro ao carregar médias históricas:', error);
    }
  };

  // Função legada para compatibilidade com realtime
  const loadFundingRates = async () => {
    loadInitialBatch();
  };

  useEffect(() => {
    loadFundingRates();

    // Cleanup: limpar timer ao desmontar componente
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const { isConnected, status, lastEvent } = useRealtimeTable<FundingRateData>({
    table: REALTIME_TABLES.FUNDING_RATES,
    event: REALTIME_EVENTS.INSERT,
    onInsert: (payload) => {
      // Update incremental: atualizar apenas a moeda específica
      const newData = payload.new as FundingRateData;

      setOpportunities(prev => {
        const existingIndex = prev.findIndex(opp => opp.coin === newData.coin);

        if (existingIndex !== -1) {
          // Atualizar moeda existente preservando médias históricas
          const updated = [...prev];
          updated[existingIndex] = {
            ...newData,
            // Preservar médias históricas que não vêm do realtime
            avg_24h: prev[existingIndex].avg_24h,
            avg_7d: prev[existingIndex].avg_7d,
            avg_30d: prev[existingIndex].avg_30d,
          };
          console.log(`✅ [Oportunidades] Moeda atualizada: ${newData.coin}`);
          return updated;
        } else {
          // Adicionar nova moeda no início
          console.log(`✅ [Oportunidades] Nova moeda adicionada: ${newData.coin}`);
          return [newData, ...prev];
        }
      });

      // Incrementa contador de atualizações
      updateCountRef.current++;

      // Limpa timer anterior se existir
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Aguarda 2 segundos sem novos INSERTs para mostrar notificação
      debounceTimerRef.current = setTimeout(() => {
        const count = updateCountRef.current;

        // Mostra notificação única
        toast.success('Funding rates atualizados!', {
          id: 'funding-rates-update',
          description: `${count} moeda${count > 1 ? 's' : ''} atualizada${count > 1 ? 's' : ''}`,
          duration: 2000,
        });

        // Reset contador
        updateCountRef.current = 0;
      }, 2000);
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
    // Retorno em valor absoluto por hora (apenas sobre os 50% expostos)
    const exposedCapital = investment * 0.5;

    // Retornos por período (apenas sobre capital exposto)
    const hourly = exposedCapital * hourlyRate;
    const sixHours = exposedCapital * hourlyRate * 6;
    const twelveHours = exposedCapital * hourlyRate * 12;
    const daily = exposedCapital * hourlyRate * 24;
    const weekly = exposedCapital * hourlyRate * 24 * 7;
    const monthly = exposedCapital * hourlyRate * 24 * 30;
    const yearly = exposedCapital * hourlyRate * 24 * 365;

    return { hourly, sixHours, twelveHours, daily, weekly, monthly, yearly };
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
              <span className="text-white">Funding</span>
              <span className="text-yellow-500"> Opportunities</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-base">
              Discover the best funding rate opportunities in the market
            </p>
          </div>
        <div className="flex items-center gap-3">
          {lastScrapedAt && (
            <div
              className="text-sm text-zinc-400 cursor-help backdrop-blur-sm bg-zinc-900/30 px-3 py-1.5 rounded-lg border border-zinc-800/50"
              title={`UTC: ${new Date(lastScrapedAt).toLocaleString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'UTC'
              })}`}
            >
              Last update:{' '}
              <span className="font-semibold text-yellow-400">
                {new Date(lastScrapedAt).toLocaleString('en-US', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZone: 'America/Sao_Paulo'
                })}{' '}
                🇧🇷 <span className="text-xs text-zinc-500">(GMT-3)</span>
              </span>
            </div>
          )}
          <RealtimeIndicator
            isConnected={isConnected}
            status={status}
            lastUpdate={lastEvent}
          />
        </div>
      </div>

      {/* Top 4 Opportunities Cards */}
      {isInitialLoading ? (
        <TopOpportunitiesSkeleton />
      ) : topOpportunities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topOpportunities.map((opp, index) => {
            // opp.hyperliquid_rate já é por HORA (valor do banco)
            const returns = calculateReturns(opp.hyperliquid_rate, 1000);
            const yearlyRate = opp.hyperliquid_rate * TIME_PERIOD_MULTIPLIERS['year'];

            return (
              <Card
                key={opp.coin}
                className="relative overflow-hidden backdrop-blur-xl bg-black/40 border border-zinc-800/50 shadow-2xl hover:shadow-yellow-500/5 transition-all duration-300 hover:border-yellow-500/20"
              >
                {/* Efeito de brilho abstrato de fundo */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/4 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-400/3 rounded-full blur-2xl pointer-events-none"></div>

                <div className={`absolute top-0 right-0 text-black text-xs font-bold px-3 py-1.5 rounded-bl-xl shadow-lg backdrop-blur-sm flex items-center gap-1.5 ${
                  yearlyRate > 1
                    ? 'bg-yellow-500 border-b border-l border-yellow-400/30 animate-pulse'
                    : 'bg-yellow-500/80 border-b border-l border-yellow-400/30'
                }`}>
                  {yearlyRate > 1 && (
                    <Rocket className="h-3.5 w-3.5 animate-bounce" />
                  )}
                  <span className="tracking-wide">TOP {index + 1}</span>
                </div>
                <CardContent className="p-6 space-y-3 relative z-10">
                  <div>
                    <a
                      href={getCoinGeckoSearchUrl(opp.coin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-2xl font-bold font-mono hover:text-yellow-400 transition-colors"
                    >
                      {opp.coin}
                    </a>
                    <p className="text-xs text-zinc-500 mt-1">Yearly Rate</p>
                    <div className="text-3xl font-bold text-yellow-500 mt-1">
                      {formatPercentage(yearlyRate)}
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-3">
                    <p className="text-xs text-zinc-400 mb-1">Yearly return with $1000</p>
                    <div className="text-lg font-semibold text-yellow-400">
                      {formatCurrency(returns.yearly)}
                    </div>
                    <p className="text-xs text-zinc-500">50% exposed = $500</p>
                  </div>

                  {/* Show More Button with Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <StarBorder
                        color="rgb(234 179 8)"
                        speed="4s"
                        size="sm"
                        className="w-full mt-2 cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          View Details
                        </div>
                      </StarBorder>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl backdrop-blur-2xl bg-black/95 border border-yellow-500/30">
                      <DialogHeader>
                        <DialogTitle className="text-3xl font-bold font-mono text-white">
                          {opp.coin}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-base">
                          Yearly Rate: <span className="text-yellow-500 font-bold text-lg">{formatPercentage(yearlyRate)}</span>
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid md:grid-cols-2 gap-6 mt-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                          <div className="border-t border-zinc-800 pt-3">
                            <p className="text-xs text-zinc-400 mb-1">Hyperliquid Open Interest</p>
                            <div className="text-xl font-bold text-white">
                              {formatLargeNumber(Number(opp.hyperliquid_oi))}
                            </div>
                          </div>

                          <div className="border-t border-zinc-800 pt-3">
                            <p className="text-xs text-zinc-400 mb-1">Yearly return with $1000</p>
                            <div className="text-xl font-semibold text-yellow-400">
                              {formatCurrency(returns.yearly)}
                            </div>
                            <p className="text-xs text-zinc-500">50% exposed = $500</p>
                          </div>

                          <div className="border-t border-zinc-800 pt-3">
                            <div className="flex flex-col gap-3">
                              <Link href="/positions">
                                <StarBorder color="rgb(34 197 94)" speed="4s" size="sm" className="w-full">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold">Add Position</span>
                                    <Plus className="h-4 w-4" />
                                  </div>
                                </StarBorder>
                              </Link>
                              <a
                                href={getHyperliquidUrl(opp.coin)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <StarBorder color="rgb(234 179 8)" speed="4s" size="sm" className="w-full">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold">Trade on Hyperliquid</span>
                                    <ExternalLink className="h-4 w-4" />
                                  </div>
                                </StarBorder>
                              </a>
                              <a
                                href={getCoinGeckoSearchUrl(opp.coin)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-zinc-800/40 hover:bg-zinc-800/60 border border-zinc-700/50 rounded-lg transition-colors"
                              >
                                <span className="font-semibold text-zinc-300">View on CoinGecko</span>
                                <ExternalLink className="h-4 w-4 text-zinc-400" />
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          <div className="border-t border-zinc-800 pt-3">
                            <p className="text-xs text-zinc-400 mb-3">Returns on $500 exposed:</p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-2 bg-zinc-900/40 rounded">
                                <span className="text-sm text-zinc-400">1 hour:</span>
                                <span className="font-semibold text-yellow-400">{formatCurrency(returns.hourly)}</span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-zinc-900/40 rounded">
                                <span className="text-sm text-zinc-400">6 hours:</span>
                                <span className="font-semibold text-yellow-400">{formatCurrency(returns.sixHours)}</span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-zinc-900/40 rounded">
                                <span className="text-sm text-zinc-400">12 hours:</span>
                                <span className="font-semibold text-yellow-400">{formatCurrency(returns.twelveHours)}</span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-zinc-900/40 rounded">
                                <span className="text-sm text-zinc-400">1 day:</span>
                                <span className="font-semibold text-yellow-400">{formatCurrency(returns.daily)}</span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-zinc-900/40 rounded">
                                <span className="text-sm text-zinc-400">7 days:</span>
                                <span className="font-semibold text-yellow-400">{formatCurrency(returns.weekly)}</span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-zinc-900/40 rounded">
                                <span className="text-sm text-zinc-400">30 days:</span>
                                <span className="font-semibold text-yellow-400">{formatCurrency(returns.monthly)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={18}
              />
              <Input
                placeholder="Search coin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-yellow-500/50 focus:ring-yellow-500/20"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistoricalColumns(!showHistoricalColumns)}
              className="flex items-center gap-2 border-zinc-700 hover:bg-zinc-800/60 hover:border-yellow-500/30 hover:text-yellow-500 transition-colors"
            >
              {showHistoricalColumns ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Historical
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800/60 hover:border-yellow-500/30 transition-colors">
              <label htmlFor="hyperliquid-toggle" className="text-sm cursor-pointer hover:text-yellow-500 transition-colors">
                Hyperliquid Only
              </label>
              <button
                id="hyperliquid-toggle"
                role="switch"
                aria-checked={showOnlyHyperliquid}
                onClick={() => setShowOnlyHyperliquid(!showOnlyHyperliquid)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                  showOnlyHyperliquid ? 'bg-yellow-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showOnlyHyperliquid ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex gap-2">
              {timePeriod === 'hour' ? (
                <StarBorder color="rgb(234 179 8)" speed="3s" size="sm" onClick={() => setTimePeriod('hour')}>
                  Hour
                </StarBorder>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimePeriod('hour')}
                  className="border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500 hover:border-yellow-500/30 transition-colors"
                >
                  Hour
                </Button>
              )}
              {timePeriod === 'day' ? (
                <StarBorder color="rgb(234 179 8)" speed="3s" size="sm" onClick={() => setTimePeriod('day')}>
                  Day
                </StarBorder>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimePeriod('day')}
                  className="border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500 hover:border-yellow-500/30 transition-colors"
                >
                  Day
                </Button>
              )}
              {timePeriod === 'week' ? (
                <StarBorder color="rgb(234 179 8)" speed="3s" size="sm" onClick={() => setTimePeriod('week')}>
                  Week
                </StarBorder>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimePeriod('week')}
                  className="border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500 hover:border-yellow-500/30 transition-colors"
                >
                  Week
                </Button>
              )}
              {timePeriod === 'month' ? (
                <StarBorder color="rgb(234 179 8)" speed="3s" size="sm" onClick={() => setTimePeriod('month')}>
                  Month
                </StarBorder>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimePeriod('month')}
                  className="border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500 hover:border-yellow-500/30 transition-colors"
                >
                  Month
                </Button>
              )}
              {timePeriod === 'year' ? (
                <StarBorder color="rgb(234 179 8)" speed="3s" size="sm" onClick={() => setTimePeriod('year')}>
                  Year
                </StarBorder>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTimePeriod('year')}
                  className="border-zinc-700 hover:bg-zinc-800/60 hover:text-yellow-500 hover:border-yellow-500/30 transition-colors"
                >
                  Year
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isInitialLoading ? (
        <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Coin</TableHead>
                    <TableHead className="text-right">Hyperliquid OI</TableHead>
                    <TableHead className="text-right">Hyperliquid ({TIME_PERIOD_LABELS[timePeriod]})</TableHead>
                    {showHistoricalColumns && (
                      <>
                        <TableHead className="text-right border-l border-zinc-700">
                          <span className="text-blue-400">Last 24h</span>
                        </TableHead>
                        <TableHead className="text-right">
                          <span className="text-purple-400">Last 7d</span>
                        </TableHead>
                        <TableHead className="text-right">
                          <span className="text-amber-400">Last 30d</span>
                        </TableHead>
                      </>
                    )}
                    {!showOnlyHyperliquid && (
                      <>
                        <TableHead className="text-right">Binance ({TIME_PERIOD_LABELS[timePeriod]})</TableHead>
                        <TableHead className="text-right">Bybit ({TIME_PERIOD_LABELS[timePeriod]})</TableHead>
                        <TableHead className="text-right">Binance-HL Arb ({TIME_PERIOD_LABELS[timePeriod]})</TableHead>
                        <TableHead className="text-right">Bybit-HL Arb ({TIME_PERIOD_LABELS[timePeriod]})</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <FundingRatesSkeleton
                    rows={10}
                    showHistoricalColumns={showHistoricalColumns}
                    showOnlyHyperliquid={showOnlyHyperliquid}
                  />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : loadingError ? (
        <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="text-red-400 text-lg">{loadingError}</div>
              <Button
                onClick={loadFundingRates}
                variant="outline"
                className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredOpportunities.length === 0 ? (
        <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="text-zinc-400 text-lg">
                {searchTerm
                  ? `No coins found for "${searchTerm}"`
                  : 'No opportunities found'}
              </div>
              {!searchTerm && (
                <p className="text-sm text-zinc-500">
                  Waiting for funding rates data from scraping system
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="backdrop-blur-xl bg-zinc-900/40 border-zinc-800/50">
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
                    {showHistoricalColumns && (
                      <>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-zinc-800/50 border-l border-zinc-700"
                          onClick={() => handleSort('avg_24h')}
                        >
                          <div className="flex items-center justify-end">
                            <span className="text-blue-400">Last 24h</span>
                            {getSortIcon('avg_24h')}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-zinc-800/50"
                          onClick={() => handleSort('avg_7d')}
                        >
                          <div className="flex items-center justify-end">
                            <span className="text-purple-400">Last 7d</span>
                            {getSortIcon('avg_7d')}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-zinc-800/50"
                          onClick={() => handleSort('avg_30d')}
                        >
                          <div className="flex items-center justify-end">
                            <span className="text-amber-400">Last 30d</span>
                            {getSortIcon('avg_30d')}
                          </div>
                        </TableHead>
                      </>
                    )}
                    {!showOnlyHyperliquid && (
                      <>
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
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.map((opp, index) => (
                    <TableRow key={opp.coin} className="hover:bg-zinc-800/30 transition-colors">
                      <TableCell className="text-center font-bold text-zinc-500">
                        #{index + 1}
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        <a
                          href={getCoinGeckoSearchUrl(opp.coin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-yellow-400 transition-colors hover:underline"
                        >
                          {opp.coin}
                        </a>
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
                      {showHistoricalColumns && (
                        <>
                          <TableCell className="text-right border-l border-gray-800">
                            {opp.avg_24h !== null && opp.avg_24h !== undefined ? (
                              <span className="text-blue-400 text-sm">
                                {formatPercentage(Number(opp.avg_24h))}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {opp.avg_7d !== null && opp.avg_7d !== undefined ? (
                              <span className="text-purple-400 text-sm">
                                {formatPercentage(Number(opp.avg_7d))}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {opp.avg_30d !== null && opp.avg_30d !== undefined ? (
                              <span className="text-amber-400 text-sm">
                                {formatPercentage(Number(opp.avg_30d))}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs">-</span>
                            )}
                          </TableCell>
                        </>
                      )}
                      {!showOnlyHyperliquid && (
                        <>
                          <TableCell className="text-right">
                            {opp.binance_rate !== null ? (
                              <span className={Number(opp.binance_rate) >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {formatPercentage(Number(opp.binance_rate))}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {opp.bybit_rate !== null ? (
                              <span className={Number(opp.bybit_rate) >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {formatPercentage(Number(opp.bybit_rate))}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {opp.binance_hl_arb !== null ? (
                              <span className={Number(opp.binance_hl_arb) >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {formatPercentage(Number(opp.binance_hl_arb))}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {opp.bybit_hl_arb !== null ? (
                              <span className={Number(opp.bybit_hl_arb) >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {formatPercentage(Number(opp.bybit_hl_arb))}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">-</span>
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredOpportunities.length > 0 && (
        <div className="text-sm text-zinc-500 text-center backdrop-blur-sm bg-zinc-900/20 py-3 px-4 rounded-lg border border-zinc-800/30">
          Showing {filteredOpportunities.length} coin(s)
          {isLoadingMore && totalCount > 0 && (
            <span className="text-yellow-400/80 font-medium ml-2 animate-pulse">
              • Carregando {opportunities.length}/{totalCount}...
            </span>
          )}
          {' • Last update: '}
          <span className="text-yellow-400/80 font-medium">
            {new Date(filteredOpportunities[0].scraped_at).toLocaleString('en-US')}
          </span>
        </div>
      )}
      </div>
    </div>
  );
}