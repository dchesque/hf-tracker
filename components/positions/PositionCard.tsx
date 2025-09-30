import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FundingBadge } from "@/components/shared/FundingBadge";
import { formatCurrency, formatPercentage, formatTimeAgo } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface PositionCardProps {
  position: {
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
    snapshots: Array<{
      currentFundingRate: number;
    }>;
    alerts: Array<any>;
  };
}

export function PositionCard({ position }: PositionCardProps) {
  const isOpen = position.status === "open";
  const currentRate =
    position.snapshots.length > 0
      ? position.snapshots[0].currentFundingRate
      : position.shortEntryFundingRate;

  const rateTrend =
    currentRate > Number(position.shortEntryFundingRate)
      ? "up"
      : currentRate < Number(position.shortEntryFundingRate)
      ? "down"
      : "stable";

  const hasAlerts = position.alerts.length > 0;
  const isProfitable = Number(position.pnlNet) >= 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-bold text-primary">
                {position.coinSymbol.substring(0, 2)}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg">{position.coinSymbol}</h3>
              <p className="text-sm text-muted-foreground">
                Aberto há {formatTimeAgo(new Date(position.openedAt))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isOpen ? "success" : "outline"}>
              {isOpen ? "Aberta" : "Fechada"}
            </Badge>
            {hasAlerts && (
              <Badge variant="warning" className="gap-1">
                <AlertCircle size={12} />
                {position.alerts.length}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Capital:</span>
            <span className="font-medium">
              {formatCurrency(Number(position.totalCapital))}
            </span>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Entry Rate:</span>
              <FundingBadge
                rate={Number(position.shortEntryFundingRate)}
                showIcon={false}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Rate:</span>
              <FundingBadge rate={Number(currentRate)} trend={rateTrend} />
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Funding Acum:</span>
              <span className="font-medium text-success">
                +{formatCurrency(Number(position.fundingAccumulated))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxas:</span>
              <span className="font-medium text-destructive">
                -{formatCurrency(Number(position.tradingFees))}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">P&L Líquido:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-lg ${
                    isProfitable ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatCurrency(Number(position.pnlNet))}
                </span>
                <span
                  className={`text-sm ${
                    isProfitable ? "text-success" : "text-destructive"
                  }`}
                >
                  ({formatPercentage(Number(position.pnlPercentage) / 100)})
                </span>
                {isProfitable ? (
                  <TrendingUp className="text-success" size={16} />
                ) : (
                  <TrendingDown className="text-destructive" size={16} />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Link href={`/posicoes/${position.id}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                Detalhes
              </Button>
            </Link>
            {isOpen && (
              <Button variant="destructive" className="flex-1" size="sm">
                Fechar Posição
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}