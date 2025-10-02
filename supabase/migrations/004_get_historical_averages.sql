-- Create RPC function to get historical totals (24h, 7d, 30d) for all coins
-- Returns the ACTUAL accumulated funding rate over each period
CREATE OR REPLACE FUNCTION get_historical_averages()
RETURNS TABLE (
  coin TEXT,
  avg_24h NUMERIC,
  avg_7d NUMERIC,
  avg_30d NUMERIC
)
LANGUAGE SQL
AS $$
  WITH averages AS (
    SELECT
      coin,
      -- Últimas 24h: soma das últimas 24 taxas horárias (1 dia completo)
      (SELECT SUM(hyperliquid_rate_avg)
       FROM funding_rates_daily frd2
       WHERE frd2.coin = frd.coin
         AND date >= CURRENT_DATE - INTERVAL '1 day'
      ) as avg_24h,
      -- Últimos 7 dias: soma de todas as taxas horárias dos últimos 7 dias
      SUM(CASE
        WHEN date >= CURRENT_DATE - INTERVAL '7 days'
        THEN hyperliquid_rate_avg
      END) as avg_7d,
      -- Últimos 30 dias: soma de todas as taxas horárias dos últimos 30 dias
      SUM(CASE
        WHEN date >= CURRENT_DATE - INTERVAL '30 days'
        THEN hyperliquid_rate_avg
      END) as avg_30d
    FROM funding_rates_daily frd
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY coin
  )
  SELECT * FROM averages;
$$;
