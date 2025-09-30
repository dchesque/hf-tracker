import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: openPositions, error } = await supabase
      .from("positions")
      .select(`
        *,
        coin:coins(symbol, name)
      `)
      .eq("status", "open");

    if (error) throw error;

    const positions = openPositions || [];

    const totalInvested = positions.reduce(
      (sum, pos) => sum + Number(pos.total_capital),
      0
    );

    const pnlTotal = positions.reduce(
      (sum, pos) => sum + Number(pos.pnl_net),
      0
    );

    const pnlPercentage = totalInvested > 0 ? (pnlTotal / totalInvested) * 100 : 0;

    const bestPosition = positions.length > 0
      ? positions.reduce((best, current) =>
          Number(current.pnl_percentage) > Number(best.pnl_percentage) ? current : best
        )
      : null;

    return NextResponse.json({
      totalInvested,
      pnlTotal,
      pnlPercentage,
      openPositions: positions.length,
      bestPosition: bestPosition
        ? {
            coin: bestPosition.coin_symbol,
            pnl: Number(bestPosition.pnl_net),
            roi: Number(bestPosition.pnl_percentage),
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Erro ao buscar métricas" },
      { status: 500 }
    );
  }
}