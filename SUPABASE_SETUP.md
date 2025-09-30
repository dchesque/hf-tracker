# Configuração do Supabase

## 1. Criar Função RPC no Supabase

Execute o SQL abaixo no SQL Editor do Supabase (https://supabase.com/dashboard/project/xqxxpjjaayvjmmqdorcj/sql/new):

```sql
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
```

## 2. Variáveis de Ambiente

As seguintes variáveis já estão configuradas no `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xqxxpjjaayvjmmqdorcj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-chave-anon>
```

## 3. Estrutura do Banco de Dados

O aplicativo usa as seguintes tabelas existentes no Supabase:

- `coins` - Lista de moedas disponíveis
- `funding_rates` - Histórico de funding rates
- `coin_markets` - Informações de mercado
- `positions` - Posições abertas/fechadas
- `position_snapshots` - Histórico de snapshots das posições
- `position_alerts` - Alertas das posições
- `user_settings` - Configurações do usuário

## 4. Permissões RLS

Certifique-se de que as políticas RLS (Row Level Security) estão configuradas corretamente no Supabase para permitir acesso público de leitura às tabelas necessárias, ou desabilite o RLS durante o desenvolvimento.

Para desabilitar RLS temporariamente (apenas para desenvolvimento):

```sql
ALTER TABLE coins DISABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE coin_markets DISABLE ROW LEVEL SECURITY;
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE position_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE position_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
```

## 5. Executar o Aplicativo

```bash
npm run dev
```

Acesse: http://localhost:3000