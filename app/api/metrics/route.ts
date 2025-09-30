import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const openPositions = await prisma.position.findMany({
      where: { status: "open" },
      include: {
        coin: true,
      },
    });

    const totalInvested = openPositions.reduce(
      (sum, pos) => sum + Number(pos.totalCapital),
      0
    );

    const pnlTotal = openPositions.reduce(
      (sum, pos) => sum + Number(pos.pnlNet),
      0
    );

    const pnlPercentage = totalInvested > 0 ? (pnlTotal / totalInvested) * 100 : 0;

    const bestPosition = openPositions.length > 0
      ? openPositions.reduce((best, current) =>
          Number(current.pnlPercentage) > Number(best.pnlPercentage) ? current : best
        )
      : null;

    return NextResponse.json({
      totalInvested,
      pnlTotal,
      pnlPercentage,
      openPositions: openPositions.length,
      bestPosition: bestPosition
        ? {
            coin: bestPosition.coinSymbol,
            pnl: Number(bestPosition.pnlNet),
            roi: Number(bestPosition.pnlPercentage),
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