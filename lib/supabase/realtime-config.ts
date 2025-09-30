export const REALTIME_CONFIG = {
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
};

export const REALTIME_EVENTS = {
  ALL: '*',
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export const REALTIME_TABLES = {
  FUNDING_RATES: 'funding_rates',
  POSITIONS: 'positions',
  POSITION_SNAPSHOTS: 'position_snapshots',
  POSITION_ALERTS: 'position_alerts',
  USER_SETTINGS: 'user_settings',
  COINS: 'coins',
  COIN_MARKETS: 'coin_markets',
} as const;

export type RealtimeEvent = typeof REALTIME_EVENTS[keyof typeof REALTIME_EVENTS];
export type RealtimeTable = typeof REALTIME_TABLES[keyof typeof REALTIME_TABLES];