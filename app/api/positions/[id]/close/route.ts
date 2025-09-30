import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const closePositionSchema = z.object({
  closedAt: z.string(),
  shortExitPrice: z.number().positive(),
  spotExitPrice: z.number().positive(),
  closingFees: z.number().min(0).optional().default(0),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const validatedData = closePositionSchema.parse(body);

    const supabase = await createClient();

    const { data: position, error: positionError } = await supabase
      .from("positions")
      .select("*")
      .eq("id", params.id)
      .single();

    if (positionError || !position) {
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
      (validatedData.shortExitPrice - Number(position.short_entry_price)) *
      Number(position.short_size) *
      -1;

    const spotPnl =
      (validatedData.spotExitPrice - Number(position.spot_entry_price)) *
      Number(position.spot_quantity);

    const totalFees =
      Number(position.trading_fees) + validatedData.closingFees;
    const pnlNet =
      Number(position.funding_accumulated) + shortPnl + spotPnl - totalFees;
    const pnlPercentage = (pnlNet / Number(position.total_capital)) * 100;

    const { data: latestFundingRate } = await supabase
      .from("funding_rates")
      .select("hyperliquid_rate")
      .eq("coin", position.coin_symbol)
      .order("scraped_at", { ascending: false })
      .limit(1)
      .single();

    const closedAt = new Date(validatedData.closedAt).toISOString();

    const { error: updateError } = await supabase
      .from("positions")
      .update({
        status: "closed",
        closed_at: closedAt,
        short_exit_price: validatedData.shortExitPrice,
        spot_exit_price: validatedData.spotExitPrice,
        closing_fees: validatedData.closingFees,
        pnl_net: pnlNet,
        pnl_percentage: pnlPercentage,
      })
      .eq("id", params.id);

    if (updateError) throw updateError;

    const { error: snapshotError } = await supabase
      .from("position_snapshots")
      .insert({
        position_id: params.id,
        current_funding_rate: latestFundingRate?.hyperliquid_rate || 0,
        funding_accumulated: position.funding_accumulated,
        pnl_funding: Number(position.funding_accumulated) - totalFees,
        pnl_net: pnlNet,
        snapshot_at: closedAt,
      });

    if (snapshotError) throw snapshotError;

    const { data: updatedPosition } = await supabase
      .from("positions")
      .select(`
        *,
        coin:coins(*),
        snapshots:position_snapshots(*),
        alerts:position_alerts(*)
      `)
      .eq("id", params.id)
      .single();

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