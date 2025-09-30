import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const closePositionSchema = z.object({
  closedAt: z.string(),
  shortExitPrice: z.number().positive(),
  spotExitPrice: z.number().positive(),
  closingFees: z.number().min(0).optional().default(0),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = closePositionSchema.parse(body);

    const position = await prisma.position.findUnique({
      where: { id: params.id },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Posição não encontrada" },
        { status: 404 }
      );
    }

    if (position.status === "closed") {
      return NextResponse.json(
        { error: "Posição já está fechada" },
        { status: 400 }
      );
    }

    const shortPnl =
      (validatedData.shortExitPrice - Number(position.shortEntryPrice)) *
      Number(position.shortSize) *
      -1;

    const spotPnl =
      (validatedData.spotExitPrice - Number(position.spotEntryPrice)) *
      Number(position.spotQuantity);

    const totalFees =
      Number(position.tradingFees) + validatedData.closingFees;
    const pnlNet =
      Number(position.fundingAccumulated) + shortPnl + spotPnl - totalFees;
    const pnlPercentage = (pnlNet / Number(position.totalCapital)) * 100;

    const latestFundingRate = await prisma.fundingRate.findFirst({
      where: { coin: position.coinSymbol },
      orderBy: { scrapedAt: "desc" },
      select: { hyperliquidRate: true },
    });

    const closedAt = new Date(validatedData.closedAt);

    const updatedPosition = await prisma.position.update({
      where: { id: params.id },
      data: {
        status: "closed",
        closedAt,
        shortExitPrice: validatedData.shortExitPrice,
        spotExitPrice: validatedData.spotExitPrice,
        closingFees: validatedData.closingFees,
        pnlNet,
        pnlPercentage,
        snapshots: {
          create: {
            currentFundingRate: latestFundingRate?.hyperliquidRate || 0,
            fundingAccumulated: position.fundingAccumulated,
            pnlFunding: Number(position.fundingAccumulated) - totalFees,
            pnlNet,
            snapshotAt: closedAt,
          },
        },
      },
      include: {
        coin: true,
        snapshots: true,
        alerts: true,
      },
    });

    return NextResponse.json(updatedPosition);
  } catch (error) {
    console.error("Error closing position:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao fechar posição" },
      { status: 500 }
    );
  }
}