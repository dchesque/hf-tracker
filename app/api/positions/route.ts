import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPositionSchema = z.object({
  coinSymbol: z.string().min(1),
  totalCapital: z.number().positive(),
  shortAmount: z.number().positive(),
  shortEntryPrice: z.number().positive(),
  shortEntryFundingRate: z.number(),
  spotAmount: z.number().positive(),
  spotExchange: z.string().min(1),
  spotEntryPrice: z.number().positive(),
  tradingFees: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  openedAt: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "open";
    const coinSymbol = searchParams.get("coinSymbol");

    const where: any = { status };
    if (coinSymbol) {
      where.coinSymbol = coinSymbol;
    }

    const positions = await prisma.position.findMany({
      where,
      include: {
        coin: {
          select: {
            symbol: true,
            name: true,
          },
        },
        snapshots: {
          orderBy: { snapshotAt: "desc" },
          take: 1,
        },
        alerts: {
          where: {
            isActive: true,
            isAcknowledged: false,
          },
        },
      },
      orderBy: { openedAt: "desc" },
    });

    return NextResponse.json(positions);
  } catch (error) {
    console.error("Error fetching positions:", error);
    return NextResponse.json(
      { error: "Erro ao buscar posições" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createPositionSchema.parse(body);

    const coin = await prisma.coin.findUnique({
      where: { symbol: validatedData.coinSymbol },
    });

    if (!coin) {
      return NextResponse.json(
        { error: "Moeda não encontrada" },
        { status: 404 }
      );
    }

    const shortSize = validatedData.shortAmount / validatedData.shortEntryPrice;
    const spotQuantity = validatedData.spotAmount / validatedData.spotEntryPrice;
    const openedAt = validatedData.openedAt
      ? new Date(validatedData.openedAt)
      : new Date();

    const position = await prisma.position.create({
      data: {
        coinId: coin.id,
        coinSymbol: validatedData.coinSymbol,
        totalCapital: validatedData.totalCapital,
        shortAmount: validatedData.shortAmount,
        shortEntryPrice: validatedData.shortEntryPrice,
        shortSize,
        shortEntryFundingRate: validatedData.shortEntryFundingRate,
        spotAmount: validatedData.spotAmount,
        spotExchange: validatedData.spotExchange,
        spotEntryPrice: validatedData.spotEntryPrice,
        spotQuantity,
        tradingFees: validatedData.tradingFees,
        notes: validatedData.notes,
        openedAt,
        status: "open",
        snapshots: {
          create: {
            currentFundingRate: validatedData.shortEntryFundingRate,
            fundingAccumulated: 0,
            pnlFunding: 0,
            pnlNet: -validatedData.tradingFees,
            snapshotAt: openedAt,
          },
        },
      },
      include: {
        coin: true,
        snapshots: true,
      },
    });

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error("Error creating position:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar posição" },
      { status: 500 }
    );
  }
}