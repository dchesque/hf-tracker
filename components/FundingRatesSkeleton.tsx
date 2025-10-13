import { TableRow, TableCell } from '@/components/ui/table';

interface FundingRatesSkeletonProps {
  rows?: number;
  showHistoricalColumns?: boolean;
  showOnlyHyperliquid?: boolean;
}

export function FundingRatesSkeleton({
  rows = 10,
  showHistoricalColumns = true,
  showOnlyHyperliquid = false
}: FundingRatesSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index} className="hover:bg-zinc-800/30 transition-colors">
          {/* Rank */}
          <TableCell className="text-center">
            <div className="h-5 w-8 bg-zinc-800/50 rounded animate-pulse mx-auto"></div>
          </TableCell>

          {/* Coin */}
          <TableCell>
            <div className="h-5 w-16 bg-zinc-800/50 rounded animate-pulse"></div>
          </TableCell>

          {/* Hyperliquid OI */}
          <TableCell className="text-right">
            <div className="h-5 w-20 bg-zinc-800/50 rounded animate-pulse ml-auto"></div>
          </TableCell>

          {/* Hyperliquid Rate */}
          <TableCell className="text-right">
            <div className="h-6 w-16 bg-zinc-700 rounded-full animate-pulse ml-auto"></div>
          </TableCell>

          {/* Historical Columns */}
          {showHistoricalColumns && (
            <>
              <TableCell className="text-right border-l border-zinc-800">
                <div className="h-5 w-14 bg-blue-900/20 rounded animate-pulse ml-auto"></div>
              </TableCell>
              <TableCell className="text-right">
                <div className="h-5 w-14 bg-purple-900/20 rounded animate-pulse ml-auto"></div>
              </TableCell>
              <TableCell className="text-right">
                <div className="h-5 w-14 bg-amber-900/20 rounded animate-pulse ml-auto"></div>
              </TableCell>
            </>
          )}

          {/* Exchange Columns */}
          {!showOnlyHyperliquid && (
            <>
              <TableCell className="text-right">
                <div className="h-5 w-14 bg-zinc-800/50 rounded animate-pulse ml-auto"></div>
              </TableCell>
              <TableCell className="text-right">
                <div className="h-5 w-14 bg-zinc-800/50 rounded animate-pulse ml-auto"></div>
              </TableCell>
              <TableCell className="text-right">
                <div className="h-5 w-14 bg-zinc-800/50 rounded animate-pulse ml-auto"></div>
              </TableCell>
              <TableCell className="text-right">
                <div className="h-5 w-14 bg-zinc-800/50 rounded animate-pulse ml-auto"></div>
              </TableCell>
            </>
          )}
        </TableRow>
      ))}
    </>
  );
}

export function TopOpportunitiesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="relative overflow-hidden backdrop-blur-xl bg-black/40 border border-zinc-800/50 shadow-2xl rounded-lg p-6"
        >
          {/* TOP Badge Skeleton */}
          <div className="absolute top-0 right-0 h-7 w-16 bg-zinc-700/50 rounded-bl-xl animate-pulse"></div>

          <div className="space-y-3 relative z-10">
            {/* Coin Name */}
            <div className="h-8 w-20 bg-zinc-800/50 rounded animate-pulse"></div>

            {/* Yearly Rate Label */}
            <div className="h-3 w-16 bg-zinc-800/50 rounded animate-pulse"></div>

            {/* Yearly Rate Value */}
            <div className="h-9 w-24 bg-yellow-900/20 rounded animate-pulse"></div>

            {/* Divider */}
            <div className="border-t border-zinc-800 pt-3">
              {/* Return Label */}
              <div className="h-3 w-32 bg-zinc-800/50 rounded animate-pulse mb-1"></div>

              {/* Return Value */}
              <div className="h-6 w-20 bg-yellow-900/20 rounded animate-pulse"></div>

              {/* Exposure Label */}
              <div className="h-3 w-24 bg-zinc-800/50 rounded animate-pulse mt-1"></div>
            </div>

            {/* Button Skeleton */}
            <div className="h-10 w-full bg-zinc-800/50 rounded-lg animate-pulse mt-2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
