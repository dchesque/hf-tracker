# Hyperliquid Funding Tracker

Sistema de monitoramento e gestão de posições de arbitragem de funding rates.

## Stack Tecnológico

- **Frontend**: Next.js 15 + TypeScript + App Router
- **Styling**: Tailwind CSS
- **Components**: Custom UI components (shadcn/ui style)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Charts**: Recharts (a implementar)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Toasts**: Sonner

## Setup

### 1. Install dependencies:
```bash
npm install
```

### 2. Configure Supabase

#### Opção A: Usar projeto Supabase existente
Se você já tem um projeto Supabase com as tabelas do schema:

1. Vá para o seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Copie a connection string em: Settings > Database > Connection String (URI)
3. Copie a anon key em: Settings > API > Project API keys (anon/public)

#### Opção B: Criar novo projeto Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Aguarde o provisionamento do banco (1-2 minutos)
4. Copie as credenciais conforme opção A

### 3. Configure environment variables

Edite o arquivo `.env` com suas credenciais do Supabase:

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

Substitua:
- `[YOUR-PASSWORD]`: Senha do banco (definida na criação do projeto)
- `[YOUR-PROJECT-REF]`: Referência do projeto (ex: `xqxxpjjaayvjmmqdorcj`)
- `[YOUR-ANON-KEY]`: Chave pública do projeto

### 4. Run Prisma migrations

Gere o Prisma Client e crie as tabelas no banco:

```bash
npx prisma generate
npx prisma db push
```

**Nota:** Use `db push` ao invés de `migrate dev` com Supabase para evitar conflitos.

### 5. (Opcional) Seed do banco

Se você já tem dados nas tabelas `coins`, `funding_rates` e `coin_markets`, pule esta etapa.

Se não, você pode popular manualmente ou usar o Prisma Studio:

```bash
npx prisma studio
```

### 6. Start the development server

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard layout group
│   │   ├── dashboard/     # Home dashboard
│   │   ├── oportunidades/ # Opportunities page
│   │   ├── posicoes/      # Positions page
│   │   ├── historico/     # History page
│   │   └── configuracoes/ # Settings page
│   └── api/               # API routes
├── components/            # React components
│   ├── dashboard/        # Dashboard-specific
│   ├── layout/           # Layout components
│   └── ui/               # Base UI components
├── lib/                  # Utilities
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # Helper functions
└── prisma/              # Database schema
    └── schema.prisma    # Prisma schema
```

## Features Implementadas

### ✅ Core Features
- **Dashboard**: Métricas agregadas (Total Investido, P&L, Posições Abertas, Melhor Posição)
- **Oportunidades**: Tabela de funding rates com filtros (rate mínimo, OI mínimo, busca)
- **Posições**: Grid de cards com posições abertas/fechadas, filtros de status
- **Detalhes da Posição**: Visualização completa de uma posição específica
- **Histórico**: Análise de posições fechadas com métricas de performance

### ✅ UI/UX
- Dark mode
- Sidebar responsiva com navegação
- Loading states
- Empty states
- Cards com hover effects
- Badges de status e funding rates
- Formatação de moeda, porcentagem e datas

### ✅ API Routes
- `GET /api/metrics` - Dashboard metrics
- `GET /api/funding-rates` - Opportunities data
- `GET /api/positions` - List positions (with filters)
- `POST /api/positions` - Create position
- `GET /api/positions/[id]` - Position details
- `PATCH /api/positions/[id]/close` - Close position
- `GET /api/coins` - List available coins

### 🚧 Próximas Features
- Modal de abrir nova posição (formulário completo)
- Modal de fechar posição
- Gráficos com Recharts (evolução P&L, funding histórico)
- Sistema de alertas (configuração e notificações)
- Página de Configurações
- Histórico de snapshots por posição
- Filtros avançados

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (visualizar/editar banco)
npx prisma studio

# Generate Prisma Client (após alterar schema)
npx prisma generate

# Push schema changes to database
npx prisma db push
```

## Estrutura das Tabelas

### Tabelas Existentes (Supabase)
- `coins`: 213 moedas rastreadas
- `funding_rates`: Histórico de funding rates (Hyperliquid, Binance, Bybit)
- `coin_markets`: Exchanges disponíveis para cada moeda
- `scraping_metadata`: Metadados de scraping
- `arbitrage_alerts`: Alertas de arbitragem
- `system_config`: Configurações do sistema

### Tabelas Novas (App)
- `positions`: Posições abertas/fechadas
- `position_snapshots`: Histórico de monitoramento
- `position_alerts`: Alertas configurados
- `user_settings`: Preferências do usuário

## Notas Importantes

1. **Supabase Connection Pooling**: Se você tiver problemas de conexão, use a Connection String com `?pgbouncer=true` para o `DATABASE_URL` e a direct connection para `DIRECT_URL`.

2. **Prisma Push vs Migrate**: Com Supabase, use `prisma db push` ao invés de `prisma migrate dev` para evitar conflitos com extensions e schemas.

3. **Dados de Teste**: A aplicação funciona melhor com dados reais. Se você não tiver dados nas tabelas `funding_rates`, a página de Oportunidades ficará vazia.

4. **Performance**: As queries foram otimizadas com indexes. Para grandes volumes de dados, considere adicionar paginação.