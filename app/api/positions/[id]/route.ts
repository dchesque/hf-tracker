import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const supabase = await createClient();

    const { data: position, error } = await supabase
      .from("positions")
      .select(`
        *,
        coin:coins(*),
        snapshots:position_snapshots(*),
        alerts:position_alerts(*)
      `)
      .eq("id", params.id)
      .single();

    if (error || !position) {
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