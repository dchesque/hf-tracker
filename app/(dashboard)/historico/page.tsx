"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatPercentage, formatDateTime } from "@/lib/utils";
import { Eye, TrendingUp, TrendingDown } from "lucide-react";

interface Position {
  id: string;
  coinSymbol: string;
  totalCapital: number;
  pnlNet: number;
  pnlPercentage: number;
  openedAt: Date;
  closedAt: Date;
}

export default function HistoricoPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/positions?status=closed")
      .then((res) => res.json())
      .then((data) => {
        setPositions(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching history:", error);
        setLoading(false);
      });
  }, []);

  const totalTrades = positions.length;
  const profitableTrades = positions.filter(
    (p) => Number(p.pnlNet) >= 0
  ).length;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

  const bestTrade =
    positions.length > 0
      ? positions.reduce((best, current) =>
          Number(current.pnlNet) > Number(best.pnlNet) ? current : best
        )
      : null;

  const worstTrade =
    positions.length > 0
      ? positions.reduce((worst, current) =>
          Number(current.pnlNet) < Number(worst.pnlNet) ? current : worst
        )
      : null;

  const totalProfit = positions.reduce(
    (sum, p) => sum + Number(p.pnlNet),
    0
  );

  const calculateDuration = (opened: Date, closed: Date) => {
    const diff = new Date(closed).getTime() - new Date(opened).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico</h1>
        <p className="text-muted-foreground mt-1">
          Visualize e analise suas posições fechadas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total de Trades</p>
            <p className="text-3xl font-bold mt-2">{totalTrades}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-3xl font-bold mt-2 text-success">
              {winRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Melhor Trade</p>
            <p className="text-2xl font-bold mt-2 text-success">
              {bestTrade ? formatCurrency(Number(bestTrade.pnlNet)) : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Pior Trade</p>
            <p className="text-2xl font-bold mt-2 text-destructive">
              {worstTrade ? formatCurrency(Number(worstTrade.pnlNet)) : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Lucro Total</p>
            <p
              className={`text-2xl font-bold mt-2 ${
                totalProfit >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {formatCurrency(totalProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          </CardContent>
        </Card>
      ) : positions.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground text-lg">
                Nenhuma posição fechada
              </div>
              <p className="text-sm text-muted-foreground">
                Suas posições fechadas aparecerão aqui
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Posições Fechadas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Moeda</TableHead>
                  <TableHead>Aberto</TableHead>
                  <TableHead>Fechado</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Capital</TableHead>
                  <TableHead>P&L Final</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => {
                  const isProfitable = Number(position.pnlNet) >= 0;
                  return (
                    <TableRow key={position.id}>
                      <TableCell className="font-mono font-bold">
                        {position.coinSymbol}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(new Date(position.openedAt)).split(" ")[0]}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(new Date(position.closedAt)).split(" ")[0]}
                      </TableCell>
                      <TableCell className="text-sm">
                        {calculateDuration(position.openedAt, position.closedAt)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(Number(position.totalCapital))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isProfitable ? "text-success" : "text-destructive"
                            }`}
                          >
                            {formatCurrency(Number(position.pnlNet))}
                          </span>
                          {isProfitable ? (
                            <TrendingUp className="text-success" size={16} />
                          ) : (
                            <TrendingDown className="text-destructive" size={16} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isProfitable ? "success" : "destructive"}
                        >
                          {formatPercentage(Number(position.pnlPercentage) / 100)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}