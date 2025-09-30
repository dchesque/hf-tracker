-- Create RPC function to get latest funding rates for each coin
CREATE OR REPLACE FUNCTION get_latest_funding_rates()
RETURNS TABLE (
  coin TEXT,
  hyperliquid_oi NUMERIC,
  hyperliquid_rate NUMERIC,
  binance_rate NUMERIC,
  bybit_rate NUMERIC,
  binance_hl_arb NUMERIC,
  bybit_hl_arb NUMERIC,
  scraped_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
AS $$
  SELECT DISTINCT ON (coin)
    coin,
    hyperliquid_oi,
    hyperliquid_rate,
    binance_rate,
    bybit_rate,
    binance_hl_arb,
    bybit_hl_arb,
    scraped_at
  FROM funding_rates
  WHERE hyperliquid_rate IS NOT NULL
    AND hyperliquid_oi IS NOT NULL
  ORDER BY coin, scraped_at DESC;
$$;