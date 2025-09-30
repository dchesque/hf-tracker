import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatPercentage } from "@/lib/utils";

interface FundingBadgeProps {
  rate: number;
  trend?: "up" | "down" | "stable";
  showIcon?: boolean;
}

export function FundingBadge({
  rate,
  trend,
  showIcon = true,
}: FundingBadgeProps) {
  const variant = rate > 0 ? "success" : rate < 0 ? "destructive" : "outline";

  return (
    <Badge variant={variant} className="gap-1">
      {showIcon && trend === "up" && <TrendingUp size={12} />}
      {showIcon && trend === "down" && <TrendingDown size={12} />}
      {showIcon && trend === "stable" && <Minus size={12} />}
      {formatPercentage(rate)}
    </Badge>
  );
}