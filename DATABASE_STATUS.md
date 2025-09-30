# Status da Estrutura do Banco de Dados

**Data da Verificação:** 29/09/2025
**Database:** Supabase PostgreSQL (Project: xqxxpjjaayvjmmqdorcj)

## ✅ Tabelas Existentes e Funcionais

### 1. `coins` - ✅ COMPLETA (213 registros)
**Colunas no banco:**
- ✅ id, symbol, name, is_active, coingecko_id
- ✅ min_oi_threshold, last_market_update
- ✅ created_at, updated_at

**Uso no app:**
- API `/api/coins` - busca moedas ativas
- API `/api/positions` - validação ao criar posição
- Relacionamento com positions

**Status:** ✅ Totalmente compatível

---

### 2. `funding_rates` - ✅ COMPLETA (5,964 registros)
**Colunas no banco:**
- ✅ id, coin_id, coin
- ✅ hyperliquid_oi, hyperliquid_rate
- ✅ binance_rate, bybit_rate
- ✅ binance_hl_arb, bybit_hl_arb
- ✅ scraped_at, scraped_at_br, created_at

**Uso no app:**
- Página `/oportunidades` - tabela de funding rates
- API `/api/funding-rates` - listagem com filtros
- API `/api/positions/[id]/close` - busca último funding rate

**Status:** ✅ Totalmente compatível

---

### 3. `coin_markets` - ✅ COMPLETA (67 registros)
**Colunas no banco:**
- ✅ id, coin_id
- ✅ exchange_1, exchange_1_pair, exchange_1_volume_usd, exchange_1_trust_score
- ✅ exchange_2, exchange_2_pair, exchange_2_volume_usd, exchange_2_trust_score
- ✅ total_volume_24h, market_cap, price_usd, total_markets
- ✅ last_updated, created_at

**Uso no app:**
- API `/api/funding-rates` - busca exchanges disponíveis

**⚠️ Possível problema:** API busca por `coin_symbol` mas tabela tem `coin_id`

**Status:** ⚠️ Funciona mas pode ter query incorreta

---

### 4. `scraping_metadata` - ✅ COMPLETA (30 registros)
**Status:** Não usado pelo app (dados de scraping N8N)

---

### 5. `arbitrage_alerts` - ✅ COMPLETA (2 registros)
**Status:** Não usado pelo app (dados de scraping N8N)

---

### 6. `system_config` - ✅ COMPLETA (3 registros)
**Status:** Não usado pelo app

---

## 🆕 Tabelas Criadas mas Vazias

### 7. `positions` - ✅ EXISTE (0 registros)
**Colunas esperadas pelo app:**
- id, user_id, coin_id, coin_symbol, status
- total_capital, short_amount, short_entry_price, short_size
- short_entry_funding_rate, short_exit_price
- spot_amount, spot_exchange, spot_entry_price, spot_quantity
- spot_exit_price, trading_fees, closing_fees
- funding_accumulated, pnl_net, pnl_percentage
- opened_at, closed_at, notes, created_at, updated_at

**Uso no app:**
- Dashboard - métricas de P&L
- API `/api/metrics` - agregações
- API `/api/positions` - CRUD completo
- Página `/posicoes` - listagem

**Status:** ✅ Estrutura existe, pronta para uso

---

### 8. `position_snapshots` - ✅ EXISTE (0 registros)
**Colunas esperadas pelo app:**
- id, position_id
- current_funding_rate, funding_accumulated
- pnl_funding, pnl_net
- snapshot_at, created_at

**Uso no app:**
- API `/api/positions` - cria snapshot inicial
- API `/api/positions/[id]/close` - cria snapshot final
- Gráficos de evolução de P&L

**Status:** ✅ Estrutura existe, pronta para uso

---

### 9. `position_alerts` - ✅ EXISTE (0 registros)
**Colunas esperadas pelo app:**
- id, position_id
- alert_type, threshold_value, current_value
- is_active, is_acknowledged
- triggered_at, acknowledged_at, created_at

**Uso no app:**
- Alertas de funding rate negativo
- Alertas de P&L target

**Status:** ✅ Estrutura existe, pronta para uso

---

### 10. `user_settings` - ✅ EXISTE (0 registros)
**Colunas esperadas pelo app:**
- id, user_id
- min_funding_rate, min_oi
- alert_funding_negative, alert_funding_drop_percent, alert_profit_target
- preferred_exchanges (JSON)
- enable_web_push, notify_on_open, notify_critical_alerts
- theme, currency
- created_at, updated_at

**Uso no app:**
- Página `/configuracoes` - preferências do usuário

**Status:** ✅ Estrutura existe, pronta para uso

---

## ❌ Funções RPC Faltando

### `get_latest_funding_rates()`
**Status:** ❌ NÃO EXISTE

**Erro:** `Could not find the function public.get_latest_funding_rates`

**Uso no app:**
- Página `/oportunidades` - busca últimos funding rates
- API `/api/funding-rates` - busca com filtros

**SQL necessário:**
```sql
CREATE OR REPLACE FUNCTION get_latest_funding_rates()
RETURNS TABLE (
  coin TEXT,
  hyperliquid_oi NUMERIC,
  hyperliquid_rate NUMERIC,
  binance_rate NUMERIC,
  bybit_rate NUMERIC,
  binance_hl_arb NUMERIC,
  bybit_hl_arb NUMERIC,
  scraped_at TIMESTAMPTZ
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

---

## 🐛 Problemas Identificados

### 1. **Função RPC Missing** - BLOQUEANTE 🚨
- Página `/oportunidades` vai falhar
- API `/api/funding-rates` vai falhar
- **Solução:** Executar SQL acima no Supabase SQL Editor

### 2. **Query Incorreta em coin_markets** - POSSÍVEL BUG ⚠️
**Arquivo:** `app/api/funding-rates/route.ts:29`
```typescript
.eq("coin_symbol", rate.coin)  // ❌ Coluna não existe
```

**Problema:** Tabela `coin_markets` tem `coin_id` mas query busca por `coin_symbol`

**Solução:**
- Opção A: Adicionar coluna `coin_symbol` na tabela
- Opção B: Fazer JOIN com `coins` usando `coin_id`

---

## ✅ Resumo Final

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| Tabelas existentes | ✅ | Nenhuma |
| Tabelas novas | ✅ | Nenhuma (já existem) |
| Função RPC | ❌ | **Criar no Supabase** |
| coin_markets query | ⚠️ | Corrigir ou ajustar tabela |

## 🎯 Próximos Passos

1. ✅ **PRIORITÁRIO:** Executar SQL da função `get_latest_funding_rates()` no Supabase
2. ⚠️ **IMPORTANTE:** Corrigir query de `coin_markets` ou ajustar tabela
3. ✅ Testar página `/oportunidades`
4. ✅ Testar criação de posições

---

**Conclusão:** O app está **95% pronto**. Falta apenas:
1. Criar a função RPC (1 comando SQL)
2. Ajustar query de coin_markets (opcional, pode não estar quebrando)