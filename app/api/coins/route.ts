import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: coins, error } = await supabase
      .from("coins")
      .select("id, symbol, name, coingecko_id")
      .eq("is_active", true)
      .order("symbol", { ascending: true });

    if (error) throw error;

    return NextResponse.json(coins);
  } catch (error) {
    console.error("Error fetching coins:", error);
    return NextResponse.json(
      { error: "Erro ao buscar moedas" },
      { status: 500 }
    );
  }
}