-- Create RPC function to get historical averages (24h, 7d, 30d) for all coins
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
      -- Última média diária (24h) - pegar o registro mais recente
      (SELECT hyperliquid_rate_avg
       FROM funding_rates_daily frd2
       WHERE frd2.coin = frd.coin
       ORDER BY date DESC
       LIMIT 1) as avg_24h,
      -- Média 7 dias
      AVG(CASE
        WHEN date >= CURRENT_DATE - INTERVAL '7 days'
        THEN hyperliquid_rate_avg
      END) as avg_7d,
      -- Média 30 dias
      AVG(CASE
        WHEN date >= CURRENT_DATE - INTERVAL '30 days'
        THEN hyperliquid_rate_avg
      END) as avg_30d
    FROM funding_rates_daily frd
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY coin
  )
  SELECT * FROM averages;
$$;
