import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Opportunity {
  coin: string;
  hyperliquidRate: number;
  binanceRate: number | null;
  bybitRate: number | null;
  spread: number;
  oi: number;
  exchanges: string[];
  scrapedAt: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minRate = parseFloat(searchParams.get("minRate") || "0.001");
    const minOi = parseFloat(searchParams.get("minOi") || "100000");

    const supabase = await createClient();

    const { data: latestRates, error } = await supabase.rpc(
      "get_latest_funding_rates"
    );

    if (error) throw error;

    const filteredRates = (latestRates || []).filter(
      (rate: any) =>
        Number(rate.hyperliquid_rate) >= minRate &&
        Number(rate.hyperliquid_oi) >= minOi
    );

    const coinSymbols = filteredRates.map((r: any) => r.coin);

    const { data: marketsData } = await supabase
      .from("coin_markets")
      .select("coin_id, exchange_1, exchange_2, coins!inner(symbol)")
      .in("coins.symbol", coinSymbols);

    const marketsMap = new Map();
    (marketsData || []).forEach((m: any) => {
      marketsMap.set(m.coins.symbol, {
        exchange_1: m.exchange_1,
        exchange_2: m.exchange_2
      });
    });

    const opportunities = filteredRates.map((rate: any) => {
      const markets = marketsMap.get(rate.coin);

      const binanceRate = rate.binance_rate ? Number(rate.binance_rate) : null;
      const bybitRate = rate.bybit_rate ? Number(rate.bybit_rate) : null;
      const hlRate = Number(rate.hyperliquid_rate);

      const spreads = [
        binanceRate ? hlRate - binanceRate : null,
        bybitRate ? hlRate - bybitRate : null,
      ].filter((s) => s !== null);

      const spread = spreads.length > 0 ? Math.max(...(spreads as number[])) : 0;

      return {
        coin: rate.coin,
        hyperliquidRate: hlRate,
        binanceRate: binanceRate,
        bybitRate: bybitRate,
        spread,
        oi: Number(rate.hyperliquid_oi),
        exchanges: markets ? [markets.exchange_1, markets.exchange_2].filter(Boolean) : [],
        scrapedAt: rate.scraped_at,
      };
    });

    opportunities.sort((a: Opportunity, b: Opportunity) => b.hyperliquidRate - a.hyperliquidRate);

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Error fetching funding rates:", error);
    return NextResponse.json(
      { error: "Erro ao buscar funding rates" },
      { status: 500 }
    );
  }
}