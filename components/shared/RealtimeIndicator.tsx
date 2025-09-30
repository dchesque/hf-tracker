'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate?: Date | null;
  className?: string;
}

export function RealtimeIndicator({
  isConnected,
  status,
  lastUpdate,
  className,
}: RealtimeIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Live',
          color: 'text-green-600 dark:text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-950/30',
          borderColor: 'border-green-300 dark:border-green-800',
          animate: true,
        };
      case 'connecting':
        return {
          icon: Wifi,
          text: 'Connecting...',
          color: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          borderColor: 'border-gray-300 dark:border-gray-700',
          animate: false,
        };
      case 'error':
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Disconnected',
          color: 'text-red-600 dark:text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-950/30',
          borderColor: 'border-red-300 dark:border-red-800',
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          config.color,
          config.animate && 'animate-pulse'
        )}
      />
      <span className={cn('text-xs font-medium', config.color)}>
        {config.text}
      </span>
      {lastUpdate && status === 'connected' && (
        <span className="text-xs text-muted-foreground border-l pl-2 ml-1">
          {formatTime(lastUpdate)}
        </span>
      )}
    </div>
  );
}