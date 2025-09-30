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
import { formatLargeNumber } from '@/lib/utils';
import { Search, RefreshCw } from 'lucide-react';
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

export default function OportunidadesPage() {
  const [opportunities, setOpportunities] = useState<FundingRateData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadFundingRates = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_latest_funding_rates');

      if (error) {
        console.error('❌ [Oportunidades] Error fetching funding rates:', error);
        toast.error('Erro ao carregar funding rates');
        return;
      }

      const sortedData = (data || []).sort(
        (a: FundingRateData, b: FundingRateData) =>
          Number(b.hyperliquid_rate) - Number(a.hyperliquid_rate)
      );

      setOpportunities(sortedData);
      console.log(`✅ [Oportunidades] Dados atualizados: ${sortedData.length} moedas carregadas`);
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

  const filteredOpportunities = useMemo(() => {
    if (!searchTerm) return opportunities;
    return opportunities.filter((opp) =>
      opp.coin.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [opportunities, searchTerm]);

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

      <Card>
        <CardContent className="p-6">
          <div className="relative">
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
                    <TableHead>Coin</TableHead>
                    <TableHead className="text-right">Hyperliquid OI</TableHead>
                    <TableHead className="text-right">Hyperliquid</TableHead>
                    <TableHead className="text-right">Binance</TableHead>
                    <TableHead className="text-right">Bybit</TableHead>
                    <TableHead className="text-right">Binance-HL Arb</TableHead>
                    <TableHead className="text-right">Bybit-HL Arb</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.map((opp) => (
                    <TableRow key={opp.coin} className="hover:bg-gray-900/50">
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