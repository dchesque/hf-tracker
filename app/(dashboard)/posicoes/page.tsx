"use client";

import { useEffect, useState } from "react";
import { PositionCard } from "@/components/positions/PositionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface Position {
  id: string;
  coinSymbol: string;
  status: string;
  totalCapital: number;
  shortEntryFundingRate: number;
  fundingAccumulated: number;
  tradingFees: number;
  pnlNet: number;
  pnlPercentage: number;
  openedAt: Date;
  coin: {
    symbol: string;
    name: string;
  };
  snapshots: Array<{
    currentFundingRate: number;
  }>;
  alerts: Array<any>;
}

export default function PosicoesPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "open"
  );

  useEffect(() => {
    const status = statusFilter === "all" ? "" : statusFilter;
    const url = status ? `/api/positions?status=${status}` : "/api/positions";

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setPositions(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching positions:", error);
        setLoading(false);
      });
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Posições</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas posições abertas e fechadas
          </p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          Nova Posição
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={statusFilter === "open" ? "default" : "outline"}
          onClick={() => setStatusFilter("open")}
          size="sm"
        >
          Abertas
        </Button>
        <Button
          variant={statusFilter === "closed" ? "default" : "outline"}
          onClick={() => setStatusFilter("closed")}
          size="sm"
        >
          Fechadas
        </Button>
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          onClick={() => setStatusFilter("all")}
          size="sm"
        >
          Todas
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : positions.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground text-lg">
                Nenhuma posição encontrada
              </div>
              <p className="text-sm text-muted-foreground">
                Comece abrindo sua primeira posição na aba Oportunidades
              </p>
              <Button className="gap-2">
                <Plus size={18} />
                Abrir Primeira Posição
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((position) => (
            <PositionCard key={position.id} position={position} />
          ))}
        </div>
      )}
    </div>
  );
}