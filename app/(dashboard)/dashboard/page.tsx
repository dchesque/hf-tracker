"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DollarSign, TrendingUp, Briefcase, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface Metrics {
  totalInvested: number;
  pnlTotal: number;
  pnlPercentage: number;
  openPositions: number;
  bestPosition: {
    coin: string;
    pnl: number;
    roi: number;
  } | null;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching metrics:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das suas posições e performance
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das suas posições e performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Investido"
          value={formatCurrency(metrics?.totalInvested || 0)}
          icon={DollarSign}
          variant="default"
        />
        <MetricCard
          label="P&L Total"
          value={formatCurrency(metrics?.pnlTotal || 0)}
          change={formatPercentage((metrics?.pnlPercentage || 0) / 100)}
          icon={TrendingUp}
          variant={
            (metrics?.pnlTotal || 0) >= 0 ? "success" : "danger"
          }
        />
        <MetricCard
          label="Posições Abertas"
          value={metrics?.openPositions || 0}
          icon={Briefcase}
          variant="default"
        />
        <MetricCard
          label="Melhor Posição"
          value={
            metrics?.bestPosition
              ? `${metrics.bestPosition.coin} ${formatPercentage(
                  metrics.bestPosition.roi / 100
                )}`
              : "-"
          }
          icon={Award}
          variant="default"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução do P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Gráfico será implementado com dados de snapshots
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Posições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {metrics?.openPositions === 0
                ? "Nenhuma posição aberta"
                : "Lista de posições será implementada"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}