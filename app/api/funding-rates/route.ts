import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minRate = parseFloat(searchParams.get("minRate") || "0.001");
    const minOi = parseFloat(searchParams.get("minOi") || "100000");

    const latestRates = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT ON (coin)
        coin,
        hyperliquid_oi as "hyperliquidOi",
        hyperliquid_rate as "hyperliquidRate",
        binance_rate as "binanceRate",
        bybit_rate as "bybitRate",
        scraped_at as "scrapedAt"
      FROM funding_rates
      WHERE hyperliquid_rate >= ${minRate}
        AND hyperliquid_oi >= ${minOi}
      ORDER BY coin, scraped_at DESC
    `;

    const opportunities = await Promise.all(
      latestRates.map(async (rate) => {
        const markets = await prisma.coinMarket.findFirst({
          where: {
            coin: {
              symbol: rate.coin,
            },
          },
          select: {
            exchange1: true,
            exchange2: true,
          },
        });

        const binanceRate = rate.binanceRate ? Number(rate.binanceRate) : null;
        const bybitRate = rate.bybitRate ? Number(rate.bybitRate) : null;
        const hlRate = Number(rate.hyperliquidRate);

        const spreads = [
          binanceRate ? hlRate - binanceRate : null,
          bybitRate ? hlRate - bybitRate : null,
        ].filter((s) => s !== null);

        const spread = spreads.length > 0 ? Math.max(...spreads) : 0;

        return {
          coin: rate.coin,
          hyperliquidRate: hlRate,
          binanceRate: binanceRate,
          bybitRate: bybitRate,
          spread,
          oi: Number(rate.hyperliquidOi),
          exchanges: [markets?.exchange1, markets?.exchange2].filter(Boolean),
          scrapedAt: rate.scrapedAt,
        };
      })
    );

    opportunities.sort((a, b) => b.hyperliquidRate - a.hyperliquidRate);

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Error fetching funding rates:", error);
    return NextResponse.json(
      { error: "Erro ao buscar funding rates" },
      { status: 500 }
    );
  }
}