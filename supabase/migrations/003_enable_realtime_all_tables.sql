-- ============================================================================
-- Migration: Enable Realtime for all app tables
-- Description: Habilita REPLICA IDENTITY FULL para todas as tabelas que
--              usarão Supabase Realtime no frontend
-- ============================================================================

-- Habilitar REPLICA IDENTITY FULL em todas as tabelas
ALTER TABLE funding_rates REPLICA IDENTITY FULL;
ALTER TABLE positions REPLICA IDENTITY FULL;
ALTER TABLE position_snapshots REPLICA IDENTITY FULL;
ALTER TABLE position_alerts REPLICA IDENTITY FULL;
ALTER TABLE coins REPLICA IDENTITY FULL;
ALTER TABLE coin_markets REPLICA IDENTITY FULL;

-- Comentários explicativos
COMMENT ON TABLE funding_rates IS 'Realtime enabled - Frontend updates automatically on INSERT';
COMMENT ON TABLE positions IS 'Realtime enabled - Frontend updates on INSERT/UPDATE/DELETE';
COMMENT ON TABLE position_snapshots IS 'Realtime enabled - Frontend updates on INSERT';
COMMENT ON TABLE position_alerts IS 'Realtime enabled - Frontend updates on INSERT/UPDATE';
COMMENT ON TABLE coins IS 'Realtime enabled for reference data updates';
COMMENT ON TABLE coin_markets IS 'Realtime enabled for market data updates';

-- Verificar configuração de REPLICA IDENTITY
SELECT
    tablename,
    CASE relreplident
        WHEN 'f' THEN '✅ FULL'
        WHEN 'd' THEN '❌ DEFAULT'
        WHEN 'n' THEN '❌ NOTHING'
        WHEN 'i' THEN '⚠️ INDEX'
        ELSE '❓ UNKNOWN: ' || relreplident
    END as replica_identity_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_tables t ON c.relname = t.tablename AND n.nspname = t.schemaname
WHERE schemaname = 'public'
  AND tablename IN (
      'funding_rates',
      'positions',
      'position_snapshots',
      'position_alerts',
      'coins',
      'coin_markets'
  )
ORDER BY tablename;

-- ============================================================================
-- IMPORTANTE: Após executar esta migration, você DEVE:
--
-- 1. Acesse o Supabase Dashboard:
--    https://supabase.com/dashboard/project/xqxxpjjaayvjmmqdorcj/database/replication
--
-- 2. Habilite Realtime para as tabelas:
--    - funding_rates
--    - positions
--    - position_snapshots
--    - position_alerts
--    - coins (opcional, se necessário)
--    - coin_markets (opcional, se necessário)
--
-- 3. Aguarde ~30 segundos para a configuração ser aplicada
--
-- 4. Teste a conexão Realtime abrindo o app em 2 abas
-- ============================================================================