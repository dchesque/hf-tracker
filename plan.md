📋 PRD Completo - Hyperliquid Funding Tracker

> **📝 Nota de Implementação:** Este projeto foi implementado usando **Supabase** (PostgreSQL) ao invés de Prisma. Todas as interações com o banco de dados usam `@supabase/supabase-js` e `@supabase/ssr`. Veja `SUPABASE_SETUP.md` para configuração.

1. Visão Geral do Produto

1.1 Nome do Produto
Hyperliquid Funding Tracker - Sistema de monitoramento e gestão de posições de arbitragem de funding rates1.2 Objetivo
Criar uma aplicação web que permita ao usuário monitorar oportunidades de arbitragem de funding rates entre exchanges de criptomoedas, gerenciar posições abertas e acompanhar o P&L acumulado através de uma estratégia market-neutral (short perpétuo + compra spot).1.3 Problema que Resolve

Dificuldade em identificar as melhores oportunidades de funding rate arbitrage
Falta de visibilidade sobre o desempenho das posições abertas
Necessidade de calcular manualmente o funding acumulado
Ausência de alertas quando posições precisam de atenção
1.4 Usuário Alvo
Traders de criptomoedas que executam estratégias de arbitragem de funding rates, especificamente usando Hyperliquid como exchange principal para posições short.2. Estratégia de Trading (Context)2.1 Mecânica da Operação
O usuário executa uma estratégia market-neutral (delta zero) que consiste em:Passo 1: Identificar moeda com alto funding rate positivo na Hyperliquid
Passo 2: Abrir duas posições simultâneas:

50% do capital: SHORT perpétuo na Hyperliquid (recebe funding)
50% do capital: COMPRA SPOT em outra exchange (hedge de preço)
Passo 3: Manter a posição aberta coletando funding rates
Passo 4: Fechar quando funding rate diminuir significativamente ou virar negativo2.2 Exemplo Prático
Capital: $1,000
Moeda: BTC (funding rate HL: +0.01% por 8h)

Posição A: Short $500 de BTC perpétuo na Hyperliquid
Posição B: Compra $500 de BTC spot na Binance

Proteção de Preço:
- BTC sobe 10% → Perde $50 no short + Ganha $50 no spot = Neutro
- BTC cai 10% → Ganha $50 no short + Perde $50 no spot = Neutro

Lucro Real:
- Funding recebido: 0.01% × $500 × 3 vezes/dia = $0.15/dia
- Em 30 dias: $4.50 (~0.9% ao mês sobre $500)3. Funcionalidades Principais3.1 Dashboard (Home)
Objetivo: Visão geral do desempenho e métricas agregadasComponentes:

4 Cards de métricas principais:

Total Investido (soma de todas posições abertas)
P&L Total (funding acumulado - taxas)
Número de Posições Abertas
Melhor Posição (maior P&L %)



Gráfico de linha: Evolução do P&L total nos últimos 30 dias

Lista resumida: Top 5 posições por P&L (com link para detalhes)
Interações:

Clicar em card de "Posições Abertas" → navega para /posicoes
Clicar em posição da lista → abre modal de detalhes
3.2 Oportunidades
Objetivo: Identificar e ranquear as melhores moedas para abrir novas posiçõesFonte de Dados:

Tabela funding_rates (atualizada a cada hora pelo N8N)
Tabela coin_markets (exchanges disponíveis)
Componentes:Filtros (topo da página):

Funding Rate Mínimo: slider (0% - 1%)
OI Mínimo: input ($100k - $10M)
Exchanges Disponíveis: multi-select (Binance, Bybit, Kraken, etc)
Moeda: search/autocomplete
Tabela de Oportunidades:
MoedaHL RateBinance RateBybit RateSpreadOI (HL)ExchangesAçãoBTC+0.13%+0.05%+0.08%0.08%$3.4M[B][By][Abrir]ETH+0.11%+0.06%+0.07%0.05%$2.1M[B][By][Abrir]Colunas:

Moeda: Ícone + símbolo
HL Rate: Badge verde/vermelho com funding da Hyperliquid
Binance/Bybit Rate: Funding das outras exchanges (pode ser null)
Spread: Diferença (HL - menor das outras) destacado em verde
OI: Open Interest formatado (K/M)
Exchanges: Pills clicáveis com logo das exchanges
Ação: Botão "Abrir Posição"
Ordenação: Por padrão, ordenar por HL Rate (maior primeiro)Interações:

Clicar em "Abrir Posição" → abre modal de cadastro
Clicar em pill de exchange → abre link externo (nova aba)
Hover na linha → highlight
3.3 Abrir Nova Posição (Modal/Dialog)
Objetivo: Cadastrar manualmente uma nova posição abertaFormulário (multi-step ou single page):Seção 1: Informações Gerais

Moeda: Select/autocomplete (carrega as 213 moedas da tabela coins)
Capital Total: Input currency ($)
Data/Hora de Abertura: DateTime picker (default: agora)
Seção 2: SHORT Hyperliquid

Valor do Short: Input currency (auto-preenchido com 50% do capital, editável)
Preço de Entrada: Input currency ($)
Funding Rate na Entrada: Input percentage (auto-preenchido do banco, editável)
Tamanho da Posição: Calculado automaticamente (valor / preço)
Seção 3: SPOT Comprado

Exchange: Select (Binance, Bybit, Kraken, Coinbase, Outras)
Valor da Compra: Input currency (auto-preenchido com 50% do capital, editável)
Preço de Compra: Input currency ($)
Quantidade Comprada: Calculado automaticamente (valor / preço)
Seção 4: Custos & Notas

Taxas de Trading: Input currency ($) - opcional
Notas: Textarea - opcional (estratégia, motivo, etc)
Validações:

Capital total > 0
Valor short + valor spot ≤ capital total
Preços > 0
Moeda não pode estar vazia
Ações:

Botão "Cancelar" (fecha modal)
Botão "Salvar Posição" (valida e salva no banco)
Após salvar:

Toast de sucesso
Redireciona para /posicoes
Posição aparece na lista
3.4 Minhas Posições
Objetivo: Listar e gerenciar todas as posições abertasFiltros (topo):

Status: tabs (Todas | Abertas | Fechadas)
Moeda: multi-select
Exchange Spot: multi-select
Ordenar por: select (P&L | Data Abertura | Capital | Moeda)
Visualização: Cards em grid (3 colunas desktop, 1 coluna mobile)Position Card:
┌─────────────────────────────────────────┐
│ [🪙 BTC]              [🟢 Aberta] [⚠️ 2] │
│                                          │
│ Capital: $1,000.00                       │
│ Aberto há: 3d 12h 45m                    │
│                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│ Entry Rate:    +0.15%                    │
│ Current Rate:  +0.12% 🔻                 │
│                                          │
│ Funding Acum:  +$23.45  (+2.35%)        │
│ Taxas:         -$2.25                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ P&L Líquido:   +$21.20  (+2.12%) 📈     │
│                                          │
│ [Detalhes]              [Fechar Posição] │
└─────────────────────────────────────────┘Badges de Alerta (canto superior direito):

🔴 Funding negativo
🟡 Funding caiu >50%
🟢 Target atingido
Interações:

Clicar no card → navega para /posicoes/[id]
Clicar "Fechar Posição" → abre modal de confirmação
Hover no card → elevação (shadow)
Empty State:
[Ilustração de carteira vazia]
Nenhuma posição aberta
Comece abrindo sua primeira posição na aba Oportunidades
[Botão: Ver Oportunidades]3.5 Detalhes da Posição
Objetivo: Visão completa de uma posição específica + históricoURL: /posicoes/[id]Layout:Header:

Breadcrumb: Posições > BTC
Título: Posição BTC #12345
Status badge: Aberta/Fechada
Botão "Fechar Posição" (se aberta)
Seção 1: Resumo (Cards lado a lado)
Capital TotalEntry RateCurrent RateTempo Aberto$1,000+0.15%+0.12%3d 12hSeção 2: P&L
Funding AcumuladoTaxas PagasP&L LíquidoROI+$23.45-$2.25+$21.20+2.12%Seção 3: Detalhes das PosiçõesColuna Esquerda - SHORT Hyperliquid:

Exchange: Hyperliquid
Tipo: Perpétuo (Short)
Valor: $500
Preço de Entrada: $63,250.00
Tamanho: 0.0079 BTC
Funding Rate Atual: +0.12%
Coluna Direita - SPOT:

Exchange: Binance
Tipo: Spot (Long)
Valor: $500
Preço de Compra: $63,180.00
Quantidade: 0.0079 BTC
Seção 4: Gráfico de Evolução

Tipo: Linha temporal
Eixo X: Tempo (horas desde abertura)
Eixo Y: Funding Rate (%)
Linha azul: Funding rate histórico
Linha tracejada cinza: Entry rate (referência)
Tooltip: Data/hora + rate exato
Seção 5: Histórico de Snapshots (Tabela)
Data/HoraFunding RateFunding AcumP&L29/09 17:00+0.12%$23.45+$21.2029/09 16:00+0.13%$22.95+$20.70............Seção 6: Configurar Alertas
[Checkbox] Notificar quando funding rate ficar negativo
[Checkbox] Notificar quando funding cair mais de [50%] vs entrada
[Checkbox] Notificar quando P&L atingir $ [100]

[Botão: Salvar Alertas]Seção 7: Notas

Campo editável com as notas da posição
Botão "Salvar Notas"
3.6 Fechar Posição (Modal)
Objetivo: Registrar o fechamento de uma posiçãoModal de Confirmação:
Fechar Posição BTC #12345

Você está prestes a fechar esta posição. Por favor, confirme os dados:

Data/Hora de Fechamento: [DateTime Picker - default: agora]

SHORT Hyperliquid:
- Preço de Saída: $ [Input]
- P&L do Short: [Calculado automaticamente]

SPOT:
- Preço de Venda: $ [Input]  
- P&L do Spot: [Calculado automaticamente]

Taxas de Fechamento: $ [Input - opcional]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resumo Final:
- Funding Total Acumulado: +$23.45
- P&L Trading (Short + Spot): -$1.20
- Taxas Totais: -$4.45
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- P&L Líquido Final: +$17.80 (+1.78%)

[Cancelar]  [Confirmar Fechamento]Após confirmar:

Atualiza status da posição para "closed"
Salva preços de saída e P&L final
Toast de sucesso
Redireciona para /historico
3.7 Histórico
Objetivo: Visualizar e analisar posições fechadasFiltros:

Período: Date range picker
Moeda: Multi-select
Exchange: Multi-select
Resultado: Todos | Lucro | Prejuízo
Cards de Métricas Agregadas:
Total de TradesWin RateMelhor TradePior TradeLucro Total4787.2%+$142.50-$23.10+$1,234.56Tabela de Posições Fechadas:
MoedaAbertoFechadoDuraçãoCapitalP&L FinalROIAçõesBTC26/0929/093d 12h$1,000+$21.20+2.12%[👁️]ETH24/0928/094d 8h$1,500+$45.80+3.05%[👁️]Ordenação: Por data de fechamento (mais recente primeiro)Interações:

Clicar em 👁️ → abre modal com detalhes completos da posição fechada
Clicar na linha → mesma ação
Gráfico de Performance (opcional):

Gráfico de barras: P&L por mês
Gráfico de pizza: Distribuição de moedas operadas
3.8 Configurações
Objetivo: Personalizar comportamento do sistemaSeções:1. Thresholds de Alertas Globais
Funding Rate Mínimo para Oportunidades: [0.10%]
OI Mínimo para Oportunidades: [$100,000]

Alerta de Funding Negativo: [Toggle ON]
Alerta quando funding cair: [50]% vs entrada
Alerta de P&L Target: $ [100]

[Salvar Configurações]2. Exchanges Preferidas
Exchanges para compra SPOT (ordenar por preferência):
☐ Binance
☐ Bybit  
☐ Kraken
☐ Coinbase
☐ OKX

[Salvar Preferências]3. Notificações
☐ Ativar notificações no navegador (Web Push)
☐ Notificar ao abrir o app (resume das posições)
☐ Notificar alertas críticos (funding negativo)

[Salvar Notificações]4. Aparência
Tema: [Dark Mode] (locked - apenas dark mode na v1)
Moeda de visualização: [USD] (BRL futuramente)

[Salvar Aparência]4. Schema do Banco de Dados (Supabase)

**Database:** PostgreSQL via Supabase
**Cliente:** @supabase/supabase-js + @supabase/ssr

**Configuração:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xqxxpjjaayvjmmqdorcj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Clientes:**
- `lib/supabase/server.ts` - Server Components e API Routes
- `lib/supabase/client.ts` - Client Components

**Função RPC:**
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

**Estrutura de Tabelas:**

## TABELAS EXISTENTES (já no Supabase)

### coins
```sql
CREATE TABLE coins (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  min_oi_threshold DECIMAL(20, 2) DEFAULT 100000,
  coingecko_id VARCHAR(100),
  last_market_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### funding_rates
```sql
CREATE TABLE funding_rates (
  id BIGSERIAL PRIMARY KEY,
  coin_id INT REFERENCES coins(id) ON DELETE CASCADE,
  coin VARCHAR(20) NOT NULL,
  hyperliquid_oi DECIMAL(20, 2),
  hyperliquid_rate DECIMAL(10, 8),
  binance_rate DECIMAL(10, 8),
  bybit_rate DECIMAL(10, 8),
  binance_hl_arb DECIMAL(10, 8),
  bybit_hl_arb DECIMAL(10, 8),
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  scraped_at_br TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_funding_rates_coin_scraped ON funding_rates(coin, scraped_at);
CREATE INDEX idx_funding_rates_scraped ON funding_rates(scraped_at);
```

model ScrapingMetadata {
  id                  Int       @id @default(autoincrement())
  totalCoins          Int?      @map("total_coins")
  successfulCoins     Int?      @map("successful_coins")
  failedCoins         Int?      @default(0) @map("failed_coins")
  sourceUrl           String?   @db.Text
  timePeriod          String?   @db.VarChar(50)
  scrapingDurationMs  Int?      @map("scraping_duration_ms")
  errorMessage        String?   @map("error_message") @db.Text
  status              String?   @default("success") @db.VarChar(20)
  scrapedAt           DateTime  @map("scraped_at") @db.Timestamptz()
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz()

  @@map("scraping_metadata")
}

model ArbitrageAlert {
  id                  Int       @id @default(autoincrement())
  coin                String    @db.VarChar(20)
  exchange            String    @db.VarChar(50)
  arbitrageValue      Decimal?  @map("arbitrage_value") @db.Decimal(10, 8)
  oiValue             Decimal?  @map("oi_value") @db.Decimal(20, 2)
  alertType           String?   @map("alert_type") @db.VarChar(50)
  thresholdCrossed    Decimal?  @map("threshold_crossed") @db.Decimal(10, 8)
  isNotified          Boolean   @default(false) @map("is_notified")
  notifiedAt          DateTime? @map("notified_at") @db.Timestamptz()
  detectedAt          DateTime  @map("detected_at") @db.Timestamptz()
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz()

  @@map("arbitrage_alerts")
}

model CoinMarket {
  id                  Int       @id @default(autoincrement())
  coinId              Int?      @map("coin_id")
  exchange1           String?   @map("exchange_1") @db.VarChar(50)
  exchange1Pair       String?   @map("exchange_1_pair") @db.VarChar(50)
  exchange1VolumeUsd  Decimal?  @map("exchange_1_volume_usd") @db.Decimal(20, 2)
  exchange1TrustScore String?   @map("exchange_1_trust_score") @db.VarChar(20)
  exchange2           String?   @map("exchange_2") @db.VarChar(50)
  exchange2Pair       String?   @map("exchange_2_pair") @db.VarChar(50)
  exchange2VolumeUsd  Decimal?  @map("exchange_2_volume_usd") @db.Decimal(20, 2)
  exchange2TrustScore String?   @map("exchange_2_trust_score") @db.VarChar(20)
  totalVolume24h      Decimal?  @map("total_volume_24h") @db.Decimal(20, 2)
  marketCap           Decimal?  @map("market_cap") @db.Decimal(20, 2)
  priceUsd            Decimal?  @map("price_usd") @db.Decimal(20, 8)
  totalMarkets        Int?      @map("total_markets")
  lastUpdated         DateTime  @default(now()) @map("last_updated") @db.Timestamptz()
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz()

  coin                Coin?     @relation(fields: [coinId], references: [id], onDelete: Cascade)

  @@map("coin_markets")
}

model SystemConfig {
  id          Int      @id @default(autoincrement())
  configKey   String   @unique @map("config_key") @db.VarChar(100)
  configValue Json     @map("config_value")
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  @@map("system_config")
}

**Outras tabelas existentes:** `scraping_metadata`, `arbitrage_alerts`, `coin_markets`, `system_config`

## NOVAS TABELAS (para o App)

> **Nota:** As definições de tabelas abaixo estão em formato de referência (Prisma-style). Na implementação real, todas as consultas são feitas via Supabase Client usando `from()`, `select()`, `insert()`, `update()`, etc. As tabelas devem ser criadas no Supabase usando SQL ou via interface.

### positions

**Estrutura SQL:**
```sql
CREATE TABLE positions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(100),
  coin_id INT NOT NULL REFERENCES coins(id),
  coin_symbol VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'open'
  
  // Capital
  totalCapital          Decimal   @map("total_capital") @db.Decimal(20, 2)
  
  // SHORT Hyperliquid
  shortAmount           Decimal   @map("short_amount") @db.Decimal(20, 2)
  shortExchange         String    @default("Hyperliquid") @map("short_exchange") @db.VarChar(50)
  shortEntryPrice       Decimal   @map("short_entry_price") @db.Decimal(20, 8)
  shortSize             Decimal   @map("short_size") @db.Decimal(20, 8) // Quantidade de moedas
  shortEntryFundingRate Decimal   @map("short_entry_funding_rate") @db.Decimal(10, 8)
  shortExitPrice        Decimal?  @map("short_exit_price") @db.Decimal(20, 8)
  
  // SPOT
  spotAmount            Decimal   @map("spot_amount") @db.Decimal(20, 2)
  spotExchange          String    @map("spot_exchange") @db.VarChar(50) // Binance, Bybit, etc
  spotEntryPrice        Decimal   @map("spot_entry_price") @db.Decimal(20, 8)
  spotQuantity          Decimal   @map("spot_quantity") @db.Decimal(20, 8) // Quantidade comprada
  spotExitPrice         Decimal?  @map("spot_exit_price") @db.Decimal(20, 8)
  
  // Custos
  tradingFees           Decimal   @default(0) @map("trading_fees") @db.Decimal(20, 2)
  closingFees           Decimal?  @map("closing_fees") @db.Decimal(20, 2)
  
  // P&L
  fundingAccumulated    Decimal   @default(0) @map("funding_accumulated") @db.Decimal(20, 8)
  pnlNet                Decimal   @default(0) @map("pnl_net") @db.Decimal(20, 8) // Funding - Fees
  pnlPercentage         Decimal   @default(0) @map("pnl_percentage") @db.Decimal(10, 4)
  
  // Timestamps
  openedAt              DateTime  @map("opened_at") @db.Timestamptz()
  closedAt              DateTime? @map("closed_at") @db.Timestamptz()
  createdAt             DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt             DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()
  
  // Notas
  notes                 String?   @db.Text
  
  // Relações
  coin                  Coin      @relation(fields: [coinId], references: [id])
  snapshots             PositionSnapshot[]
  alerts                PositionAlert[]

  @@index([userId, status])
  @@index([coinSymbol, status])
  @@index([openedAt])
  @@map("positions")
}

model PositionSnapshot {
  id                    String    @id @default(cuid())
  positionId            String    @map("position_id")
  
  // Funding Rate atual
  currentFundingRate    Decimal   @map("current_funding_rate") @db.Decimal(10, 8)
  fundingAccumulated    Decimal   @map("funding_accumulated") @db.Decimal(20, 8)
  
  // Preços (para análise futura de basis risk)
  spotPrice             Decimal?  @map("spot_price") @db.Decimal(20, 8)
  perpPrice             Decimal?  @map("perp_price") @db.Decimal(20, 8)
  
  // P&L no momento
  pnlFunding            Decimal   @map("pnl_funding") @db.Decimal(20, 8)
  pnlNet                Decimal   @map("pnl_net") @db.Decimal(20, 8)
  
  // Timestamp
  snapshotAt            DateTime  @map("snapshot_at") @db.Timestamptz()
  createdAt             DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  
  // Relação
  position              Position  @relation(fields: [positionId], references: [id], onDelete: Cascade)

  @@index([positionId, snapshotAt])
  @@map("position_snapshots")
}

model PositionAlert {
  id                    String    @id @default(cuid())
  positionId            String    @map("position_id")
  
  // Tipo de alerta
  alertType             String    @map("alert_type") @db.VarChar(50) 
  // funding_negative, funding_drop, profit_target
  
  // Configuração
  thresholdValue        Decimal?  @map("threshold_value") @db.Decimal(20, 8)
  
  // Status
  isActive              Boolean   @default(true) @map("is_active")
  isAcknowledged        Boolean   @default(false) @map("is_acknowledged")
  
  // Dados do trigger
  currentValue          Decimal?  @map("current_value") @db.Decimal(20, 8)
  message               String?   @db.Text
  
  // Timestamps
  triggeredAt           DateTime? @map("triggered_at") @db.Timestamptz()
  acknowledgedAt        DateTime? @map("acknowledged_at") @db.Timestamptz()
  createdAt             DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  
  // Relação
  position              Position  @relation(fields: [positionId], references: [id], onDelete: Cascade)

  @@index([positionId, isActive])
  @@index([triggeredAt])
  @@map("position_alerts")
}

model UserSettings {
  id                      String    @id @default(cuid())
  userId                  String    @unique @map("user_id") @db.VarChar(100)
  
  // Thresholds
  minFundingRate          Decimal   @default(0.001) @map("min_funding_rate") @db.Decimal(10, 8)
  minOi                   Decimal   @default(100000) @map("min_oi") @db.Decimal(20, 2)
  
  // Alertas
  alertFundingNegative    Boolean   @default(true) @map("alert_funding_negative")
  alertFundingDropPercent Decimal   @default(50) @map("alert_funding_drop_percent") @db.Decimal(5, 2)
  alertProfitTarget       Decimal?  @map("alert_profit_target") @db.Decimal(20, 2)
  
  // Exchanges preferidas (JSON array)
  preferredExchanges      Json      @default("[]") @map("preferred_exchanges")
  
  // Notificações
  enableWebPush           Boolean   @default(false) @map("enable_web_push")
  notifyOnOpen            Boolean   @default(true) @map("notify_on_open")
  notifyCriticalAlerts    Boolean   @default(true) @map("notify_critical_alerts")
  
  // Aparência
  theme                   String    @default("dark") @db.VarChar(20)
  currency                String    @default("USD") @db.VarChar(10)
  
  // Timestamps
  createdAt               DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt               DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz()

  @@map("user_settings")
}5. Fluxo de Dados (Flowchart Mermaid)mermaid%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor':'#1e293b','primaryTextColor':'#e2e8f0','primaryBorderColor':'#475569','lineColor':'#64748b','secondaryColor':'#334155','tertiaryColor':'#0f172a'}}}%%

graph TB
    Start([👤 Usuário acessa o App]) --> Dashboard[📊 Dashboard]
    
    Dashboard --> |Visualizar métricas| MetricsAPI[📈 GET /api/metrics]
    MetricsAPI --> |Calcula P&L agregado| DBPositions[(💾 positions + snapshots)]
    
    Dashboard --> |Ver oportunidades| Opportunities[🎯 Oportunidades]
    
    Opportunities --> |Carregar dados| FundingAPI[📡 GET /api/funding-rates]
    FundingAPI --> DBFunding[(💾 funding_rates + coin_markets)]
    
    Opportunities --> |Filtrar/Ordenar| FilterUI[🔍 Aplicar Filtros]
    FilterUI --> TableDisplay[📋 Tabela de Oportunidades]
    
    TableDisplay --> |Clicar "Abrir Posição"| OpenModal[➕ Modal: Nova Posição]
    
    OpenModal --> |Preencher formulário| FormValidation{✅ Validar dados}
    FormValidation --> |Inválido| ShowError[❌ Mostrar erros]
    ShowError --> OpenModal
    
    FormValidation --> |Válido| CreatePosition[💾 POST /api/positions]
    CreatePosition --> DBPositions
    CreatePosition --> |Sucesso| ToastSuccess[✅ Toast: Posição criada]
    ToastSuccess --> MyPositions[💼 Minhas Posições]
    
    Dashboard --> |Ver posições| MyPositions
    
    MyPositions --> |Carregar lista| PositionsAPI[📡 GET /api/positions?status=open]
    PositionsAPI --> DBPositions
    
    MyPositions --> |Clicar em card| PositionDetail[🔍 Detalhes da Posição]
    
    PositionDetail --> |Carregar dados| DetailAPI[📡 GET /api/positions/:id]
    DetailAPI --> DBPositions
    
    PositionDetail --> |Carregar histórico| SnapshotsAPI[📡 GET /api/snapshots?positionId=:id]
    SnapshotsAPI --> DBSnapshots[(💾 position_snapshots)]
    
    PositionDetail --> |Configurar alertas| AlertsForm[⚠️ Form: Alertas]
    AlertsForm --> SaveAlerts[💾 POST /api/position-alerts]
    SaveAlerts --> DBAlerts[(💾 position_alerts)]
    
    PositionDetail --> |Clicar "Fechar"| CloseModal[🔒 Modal: Fechar Posição]
    
    CloseModal --> |Preencher preços saída| CloseValidation{✅ Validar fechamento}
    CloseValidation --> |Inválido| ShowCloseError[❌ Mostrar erros]
    ShowCloseError --> CloseModal
    
    CloseValidation --> |Válido| ClosePosition[💾 PATCH /api/positions/:id/close]
    ClosePosition --> |Atualiza status| DBPositions
    ClosePosition --> |Calcula P&L final| FinalPnL[💰 Calcular P&L Final]
    FinalPnL --> |Salva snapshot final| DBSnapshots
    FinalPnL --> ToastClosed[✅ Toast: Posição fechada]
    ToastClosed --> History[📜 Histórico]
    
    MyPositions --> |Ver fechadas| History
    
    History --> |Carregar lista| HistoryAPI[📡 GET /api/positions?status=closed]
    HistoryAPI --> DBPositions
    
    History --> |Ver detalhes| HistoryDetail[📊 Detalhes Posição Fechada]
    HistoryDetail --> DetailAPI
    
    Dashboard --> |Acessar| Settings[⚙️ Configurações]
    
    Settings --> |Editar thresholds| SettingsForm[📝 Formulário Config]
    SettingsForm --> SaveSettings[💾 POST /api/user-settings]
    SaveSettings --> DBSettings[(💾 user_settings)]
    
    %% Background Jobs
    
    N8N[🤖 N8N Workflow] -.->|A cada hora| ScrapeFunding[🌐 Scrape Hyperliquid]
    ScrapeFunding -.->|Salva dados| DBFunding
    
    CronJob[⏰ Cron Job] -.->|A cada hora| MonitorJob[🔄 Monitor Positions]
    MonitorJob -.->|Para cada posição aberta| DBPositions
    MonitorJob -.->|Busca funding atual| DBFunding
    MonitorJob -.->|Calcula funding acum| CalcFunding[🧮 Calcular P&L]
    CalcFunding -.->|Salva snapshot| DBSnapshots
    
    CalcFunding -.->|Verifica thresholds| CheckAlerts{⚠️ Alertas?}
    CheckAlerts -.->|Sim| TriggerAlert[🔔 Criar Alerta]
    TriggerAlert -.->|Salva| DBAlerts
    TriggerAlert -.->|Se Web Push ON| SendPush[📲 Enviar Notificação]
    
    CheckAlerts -.->|Não| EndJob([Fim do Job])
    SendPush -.-> EndJob
    
    %% Estilos
    classDef userAction fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef apiCall fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    classDef database fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    classDef background fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    classDef decision fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    
    class Start,Dashboard,Opportunities,MyPositions,PositionDetail,History,Settings userAction
    class MetricsAPI,FundingAPI,PositionsAPI,DetailAPI,SnapshotsAPI,SaveAlerts,HistoryAPI,SaveSettings,CreatePosition,ClosePosition apiCall
    class DBPositions,DBFunding,DBSnapshots,DBAlerts,DBSettings database
    class N8N,ScrapeFunding,CronJob,MonitorJob,CalcFunding,TriggerAlert,SendPush background
    class FormValidation,CloseValidation,CheckAlerts decision6. APIs Gratuitas Recomendadas6.1 Para Preços em Tempo RealCoinGecko API (Free)

Endpoint: https://api.coingecko.com/api/v3
Rate Limit: 10-50 calls/min (free tier)
Uso: Preços spot, volume, market data
Você já tem coingecko_id na tabela coins!
Binance Public API

Endpoint: https://api.binance.com/api/v3
Rate Limit: 1200 requests/min
Uso: Preços spot em tempo real
WebSocket: wss://stream.binance.com:9443/ws
Bybit Public API

Endpoint: https://api.bybit.com/v5
Rate Limit: 120 requests/min
Uso: Preços spot e perpétuos
6.2 Para Funding RatesHyperliquid API

Endpoint: https://api.hyperliquid.xyz/info
Sem autenticação
Método: POST com body {"type": "metaAndAssetCtxs"}
Retorna: Funding rates de todas moedas
Binance Futures API

Endpoint: GET /fapi/v1/fundingRate
Rate Limit: 1200 requests/min
Params: symbol=BTCUSDT&limit=1
Bybit API

Endpoint: GET /v5/market/funding/history
Params: category=linear&symbol=BTCUSDT&limit=1
7. Tecnologias e Stack

7.1 Frontend

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Styling:** Tailwind CSS v4 (@tailwindcss/postcss)
- **Componentes:** shadcn/ui style (manual components)
- **Ícones:** Lucide React
- **Gráficos:** Recharts
- **Formulários:** React Hook Form + Zod
- **Animações:** Framer Motion
- **Notificações:** Sonner (toasts)

7.2 Backend

- **Database:** PostgreSQL (Supabase)
- **Cliente DB:** @supabase/supabase-js + @supabase/ssr
- **API:** Next.js API Routes
- **Auth:** Supabase Auth (futuro)
- **Background Jobs:** N8N (scraping externo) + Supabase Edge Functions
7.3 Deployment

Hosting: Vercel (Next.js)
Database: Supabase (PostgreSQL)
CDN: Vercel Edge Network
Monitoring: Vercel Analytics
8. Roadmap de ImplementaçãoSprint 1: Foundation (Semana 1)

 Setup Next.js 15 + TypeScript
 Configurar Tailwind + shadcn/ui
 Criar design system (tokens, componentes)
 Setup Prisma + migrations
 Criar API routes básicas (positions, funding-rates)
Sprint 2: Core Features (Semana 2)

 Dashboard (métricas + cards)
 Oportunidades (tabela + filtros)
 Abrir posição (modal + form)
 Minhas posições (listagem + cards)
Sprint 3: Position Management (Semana 3)

 Detalhes da posição
 Gráfico de evolução do funding
 Sistema de alertas (CRUD)
 Fechar posição (modal + cálculos)
Sprint 4: History & Settings (Semana 4)

 Histórico de posições fechadas
 Configurações globais
 User settings (salvar preferências)
 Responsividade mobile
Sprint 5: Monitoring & Alerts (Semana 5)

 Edge Function para monitoramento automático
 Cron job para snapshots
 Sistema de notificações internas
 Web Push API (opcional)
Sprint 6: Polimento & Launch (Semana 6)

 Testes e2e
 Performance optimization
 Error handling robusto
 Deploy em produção
9. Métricas de SucessoKPIs do Produto

Tempo para abrir posição: < 2 minutos
Acurácia dos cálculos: 100% (P&L correto)
Uptime do monitoring: > 99%
Latência das queries: < 500ms
Métricas de UX

Page Load Time: < 2s
Time to Interactive: < 3s
Bounce Rate: < 20%
User Satisfaction: > 4.5/5
