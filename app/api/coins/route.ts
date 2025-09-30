import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const coins = await prisma.coin.findMany({
      where: { isActive: true },
      orderBy: { symbol: "asc" },
      select: {
        id: true,
        symbol: true,
        name: true,
        coingeckoId: true,
      },
    });

    return NextResponse.json(coins);
  } catch (error) {
    console.error("Error fetching coins:", error);
    return NextResponse.json(
      { error: "Erro ao buscar moedas" },
      { status: 500 }
    );
  }
}