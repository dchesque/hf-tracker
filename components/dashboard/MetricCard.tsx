import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  variant?: "default" | "success" | "danger";
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  variant = "default",
}: MetricCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400">{label}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {change && (
              <p
                className={cn(
                  "text-xs mt-2 font-medium",
                  variant === "success" && "text-green-500",
                  variant === "danger" && "text-red-500",
                  variant === "default" && "text-gray-400"
                )}
              >
                {change}
              </p>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-lg",
              variant === "success" && "bg-green-600/10 text-green-500",
              variant === "danger" && "bg-red-600/10 text-red-500",
              variant === "default" && "bg-blue-600/10 text-blue-500"
            )}
          >
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}