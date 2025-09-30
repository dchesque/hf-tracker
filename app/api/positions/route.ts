import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    const supabase = await createClient();

    let query = supabase
      .from("positions")
      .select(`
        *,
        coin:coins(symbol, name),
        snapshots:position_snapshots(*)!inner,
        alerts:position_alerts(*)
      `)
      .eq("status", status)
      .eq("alerts.is_active", true)
      .eq("alerts.is_acknowledged", false)
      .order("opened_at", { ascending: false });

    if (coinSymbol) {
      query = query.eq("coin_symbol", coinSymbol);
    }

    const { data: positions, error } = await query;

    if (error) throw error;

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

    const supabase = await createClient();

    const { data: coin, error: coinError } = await supabase
      .from("coins")
      .select("id")
      .eq("symbol", validatedData.coinSymbol)
      .single();

    if (coinError || !coin) {
      return NextResponse.json(
        { error: "Moeda não encontrada" },
        { status: 404 }
      );
    }

    const shortSize = validatedData.shortAmount / validatedData.shortEntryPrice;
    const spotQuantity = validatedData.spotAmount / validatedData.spotEntryPrice;
    const openedAt = validatedData.openedAt
      ? new Date(validatedData.openedAt).toISOString()
      : new Date().toISOString();

    const { data: position, error: positionError } = await supabase
      .from("positions")
      .insert({
        coin_id: coin.id,
        coin_symbol: validatedData.coinSymbol,
        total_capital: validatedData.totalCapital,
        short_amount: validatedData.shortAmount,
        short_entry_price: validatedData.shortEntryPrice,
        short_size: shortSize,
        short_entry_funding_rate: validatedData.shortEntryFundingRate,
        spot_amount: validatedData.spotAmount,
        spot_exchange: validatedData.spotExchange,
        spot_entry_price: validatedData.spotEntryPrice,
        spot_quantity: spotQuantity,
        trading_fees: validatedData.tradingFees,
        notes: validatedData.notes,
        opened_at: openedAt,
        status: "open",
      })
      .select()
      .single();

    if (positionError) throw positionError;

    const { error: snapshotError } = await supabase
      .from("position_snapshots")
      .insert({
        position_id: position.id,
        current_funding_rate: validatedData.shortEntryFundingRate,
        funding_accumulated: 0,
        pnl_funding: 0,
        pnl_net: -validatedData.tradingFees,
        snapshot_at: openedAt,
      });

    if (snapshotError) throw snapshotError;

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