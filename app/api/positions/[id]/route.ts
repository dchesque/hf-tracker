import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const position = await prisma.position.findUnique({
      where: { id: params.id },
      include: {
        coin: true,
        snapshots: {
          orderBy: { snapshotAt: "desc" },
        },
        alerts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Posição não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(position);
  } catch (error) {
    console.error("Error fetching position:", error);
    return NextResponse.json(
      { error: "Erro ao buscar posição" },
      { status: 500 }
    );
  }
}