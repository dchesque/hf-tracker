"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FundingBadge } from "@/components/shared/FundingBadge";
import { formatCurrency, formatPercentage, formatDateTime } from "@/lib/utils";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

interface Position {
  id: string;
  coinSymbol: string;
  status: string;
  totalCapital: number;
  shortAmount: number;
  shortEntryPrice: number;
  shortSize: number;
  shortEntryFundingRate: number;
  spotAmount: number;
  spotExchange: string;
  spotEntryPrice: number;
  spotQuantity: number;
  tradingFees: number;
  fundingAccumulated: number;
  pnlNet: number;
  pnlPercentage: number;
  openedAt: Date;
  notes: string | null;
  snapshots: Array<{
    currentFundingRate: number;
    fundingAccumulated: number;
    pnlNet: number;
    snapshotAt: Date;
  }>;
}

export default function PositionDetailPage() {
  const params = useParams();
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/positions/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setPosition(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching position:", error);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Posição não encontrada</p>
            <Link href="/posicoes">
              <Button className="mt-4">Voltar para Posições</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentRate =
    position.snapshots.length > 0
      ? position.snapshots[0].currentFundingRate
      : position.shortEntryFundingRate;
  const isOpen = position.status === "open";
  const isProfitable = Number(position.pnlNet) >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/posicoes">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Posição {position.coinSymbol}</h1>
            <p className="text-muted-foreground mt-1">
              Aberto em {formatDateTime(new Date(position.openedAt))}
            </p>
          </div>
        </div>
        <Badge variant={isOpen ? "success" : "outline"}>
          {isOpen ? "Aberta" : "Fechada"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Capital Total</p>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(Number(position.totalCapital))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Entry Rate</p>
            <div className="mt-2">
              <FundingBadge
                rate={Number(position.shortEntryFundingRate)}
                showIcon={false}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Current Rate</p>
            <div className="mt-2">
              <FundingBadge rate={Number(currentRate)} showIcon={false} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-2xl font-bold mt-2">{isOpen ? "Ativa" : "Fechada"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Funding Acumulado</p>
            <p className="text-2xl font-bold mt-2 text-success">
              {formatCurrency(Number(position.fundingAccumulated))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Taxas Pagas</p>
            <p className="text-2xl font-bold mt-2 text-destructive">
              -{formatCurrency(Number(position.tradingFees))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">P&L Líquido</p>
            <p
              className={`text-2xl font-bold mt-2 ${
                isProfitable ? "text-success" : "text-destructive"
              }`}
            >
              {formatCurrency(Number(position.pnlNet))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">ROI</p>
            <div className="flex items-center gap-2 mt-2">
              <p
                className={`text-2xl font-bold ${
                  isProfitable ? "text-success" : "text-destructive"
                }`}
              >
                {formatPercentage(Number(position.pnlPercentage) / 100)}
              </p>
              {isProfitable ? (
                <TrendingUp className="text-success" size={20} />
              ) : (
                <TrendingDown className="text-destructive" size={20} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SHORT Hyperliquid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Exchange:</span>
              <span className="font-medium">Hyperliquid</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <span className="font-medium">Perpétuo (Short)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-medium">
                {formatCurrency(Number(position.shortAmount))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Preço Entrada:</span>
              <span className="font-medium">
                {formatCurrency(Number(position.shortEntryPrice))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tamanho:</span>
              <span className="font-medium">
                {Number(position.shortSize).toFixed(8)} {position.coinSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Funding Rate:</span>
              <FundingBadge
                rate={Number(currentRate)}
                showIcon={false}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SPOT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Exchange:</span>
              <span className="font-medium">{position.spotExchange}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <span className="font-medium">Spot (Long)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor:</span>
              <span className="font-medium">
                {formatCurrency(Number(position.spotAmount))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Preço Compra:</span>
              <span className="font-medium">
                {formatCurrency(Number(position.spotEntryPrice))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Quantidade:</span>
              <span className="font-medium">
                {Number(position.spotQuantity).toFixed(8)} {position.coinSymbol}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {position.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{position.notes}</p>
          </CardContent>
        </Card>
      )}

      {isOpen && (
        <div className="flex justify-end">
          <Button variant="destructive" size="lg">
            Fechar Posição
          </Button>
        </div>
      )}
    </div>
  );
}