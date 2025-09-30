import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FundingBadge } from "@/components/shared/FundingBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLargeNumber } from "@/lib/utils";
import { Search } from "lucide-react";

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

async function getLatestFundingRates(): Promise<FundingRateData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_latest_funding_rates');

  if (error) {
    console.error('Error fetching funding rates:', error);
    return [];
  }

  return (data || []).sort(
    (a: FundingRateData, b: FundingRateData) =>
      Number(b.hyperliquid_rate) - Number(a.hyperliquid_rate)
  );
}

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const opportunities = await getLatestFundingRates();
  const searchTerm = searchParams.search?.toLowerCase() || "";

  const filteredOpportunities = searchTerm
    ? opportunities.filter((opp) =>
        opp.coin.toLowerCase().includes(searchTerm)
      )
    : opportunities;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Oportunidades</h1>
        <p className="text-gray-400 mt-1">
          Melhores oportunidades de funding rate arbitrage
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action="/oportunidades" method="get">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                name="search"
                placeholder="Buscar moeda..."
                defaultValue={searchTerm}
                className="pl-10"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {filteredOpportunities.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="text-gray-400 text-lg">
                {searchTerm
                  ? `Nenhuma moeda encontrada para "${searchTerm}"`
                  : "Nenhuma oportunidade encontrada"}
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
          Mostrando {filteredOpportunities.length} moeda(s) • Última atualização:{" "}
          {new Date(filteredOpportunities[0].scraped_at).toLocaleString("pt-BR")}
        </div>
      )}
    </div>
  );
}