# Hyperliquid Funding Tracker

Aplicação Next.js 15 para monitoramento e gerenciamento de posições de arbitragem de funding rate em criptomoedas.

## Stack Tecnológico

- **Next.js 15** - App Router, Server Components
- **TypeScript** - Tipagem estática
- **Supabase** - PostgreSQL Database + Auth
- **Tailwind CSS v4** - Estilização
- **Recharts** - Gráficos e visualizações
- **Zod** - Validação de schemas
- **Framer Motion** - Animações

## Instalação

```bash
npm install
```

## Configuração

1. Copie `.env.example` para `.env`
2. Configure as variáveis do Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Execute o SQL da função RPC no Supabase (veja `SUPABASE_SETUP.md`)

## Executar

```bash
npm run dev
```

Acesse: http://localhost:3000

## Estrutura do Projeto

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Páginas principais
│   │   ├── dashboard/     # Dashboard com métricas
│   │   ├── oportunidades/ # Funding rates e arbitragem
│   │   ├── posicoes/      # Gestão de posições
│   │   ├── historico/     # Histórico de posições fechadas
│   │   └── configuracoes/ # Configurações do usuário
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── dashboard/         # Componentes do dashboard
│   ├── layout/            # Layout e navegação
│   ├── shared/            # Componentes compartilhados
│   └── ui/                # Componentes base (shadcn-style)
├── lib/
│   ├── supabase/          # Clientes Supabase
│   └── utils.ts           # Utilitários
└── supabase/
    └── migrations/        # SQL migrations

```

## Funcionalidades

### Dashboard
- Métricas gerais (Capital Total, P&L, Posições Abertas)
- Visão geral de performance
- Alertas e notificações

### Oportunidades
- Tabela de funding rates em tempo real
- Comparação Hyperliquid vs Binance vs Bybit
- Cálculo automático de arbitragem
- Filtro por moeda

### Posições
- Criar novas posições
- Acompanhar P&L em tempo real
- Fechar posições com cálculo automático
- Histórico de snapshots

### Histórico
- Análise de posições fechadas
- ROI e performance histórica
- Estatísticas agregadas

## Documentação

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Configuração do banco de dados
- **[plan.md](./plan.md)** - PRD completo do projeto

## Licença

MIT