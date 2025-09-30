# 🚀 Quick Start - Hyperliquid Funding Tracker

## Passo a Passo para Rodar a Aplicação

### 1️⃣ Configure o Supabase

Você já tem as credenciais no arquivo `.env`:

```bash
DATABASE_URL="postgresql://postgres:[senha]@db.xqxxpjjaayvjmmqdorcj.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[senha]@db.xqxxpjjaayvjmmqdorcj.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://xqxxpjjaayvjmmqdorcj.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Você só precisa adicionar a senha do banco de dados** nos lugares marcados `[senha]`.

Para encontrar a senha:
1. Vá para https://supabase.com/dashboard/project/xqxxpjjaayvjmmqdorcj/settings/database
2. A senha foi definida quando você criou o projeto
3. Se não lembra, pode resetar em "Reset database password"

### 2️⃣ Instale as Dependências

```bash
npm install
```

### 3️⃣ Configure o Banco de Dados

```bash
# Gera o Prisma Client
npx prisma generate

# Cria as tabelas no Supabase
npx prisma db push
```

**Importante**: O `prisma db push` vai criar as tabelas **novas** (positions, position_snapshots, etc).

As tabelas existentes (coins, funding_rates, coin_markets) **não serão afetadas**.

### 4️⃣ Verifique se as Tabelas Foram Criadas

```bash
# Abre o Prisma Studio para visualizar o banco
npx prisma studio
```

Você deve ver:
- ✅ Tabelas existentes: coins, funding_rates, coin_markets, etc
- ✅ Tabelas novas: positions, position_snapshots, position_alerts, user_settings

### 5️⃣ Rode a Aplicação

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🎯 Testando a Aplicação

### Dashboard
1. Acesse http://localhost:3000/dashboard
2. Você verá os cards de métricas (tudo zerado se não houver posições)

### Oportunidades
1. Acesse http://localhost:3000/oportunidades
2. **Se aparecer "Nenhuma oportunidade encontrada"**:
   - Significa que não há dados na tabela `funding_rates`
   - Você precisa popular essa tabela com dados (via N8N ou manualmente)
3. **Se aparecer uma tabela com moedas**:
   - Teste os filtros (rate mínimo, OI mínimo, busca)
   - Clique em "Abrir" (ainda não implementado)

### Posições
1. Acesse http://localhost:3000/posicoes
2. Você verá "Nenhuma posição encontrada" (normal, ainda não criamos nenhuma)
3. Para testar, você pode criar uma posição via Prisma Studio:
   - Abra `npx prisma studio`
   - Vá para a tabela `positions`
   - Clique em "Add record"
   - Preencha os campos necessários

### Histórico
1. Acesse http://localhost:3000/historico
2. Você verá "Nenhuma posição fechada" (normal)

## 🔧 Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se a senha está correta no `.env`
- Verifique se o projeto Supabase está ativo
- Teste a conexão direto no Supabase Dashboard > SQL Editor

### Erro: "Table does not exist"
- Rode `npx prisma db push` novamente
- Verifique no Prisma Studio se as tabelas foram criadas

### Página de Oportunidades vazia
- Normal se não houver dados em `funding_rates`
- Você precisa popular essa tabela via N8N ou script

### Erro no Prisma Client
- Rode `npx prisma generate` novamente
- Delete a pasta `node_modules/.prisma` e rode `npm install`

## 📦 Testando com Dados de Exemplo

Se você quiser testar a aplicação com dados fake, pode usar o Prisma Studio:

### 1. Criar uma moeda (se não existir)
```
Tabela: coins
- symbol: BTC
- name: Bitcoin
- is_active: true
```

### 2. Criar uma posição de teste
```
Tabela: positions
- coin_id: [ID da moeda criada]
- coin_symbol: BTC
- status: open
- total_capital: 1000
- short_amount: 500
- short_entry_price: 63000
- short_size: 0.00793651
- short_entry_funding_rate: 0.00015
- spot_amount: 500
- spot_exchange: Binance
- spot_entry_price: 63000
- spot_quantity: 0.00793651
- trading_fees: 2.5
- funding_accumulated: 0
- pnl_net: -2.5
- pnl_percentage: -0.25
- opened_at: [Data atual]
```

### 3. Criar um snapshot inicial
```
Tabela: position_snapshots
- position_id: [ID da posição criada]
- current_funding_rate: 0.00015
- funding_accumulated: 0
- pnl_funding: 0
- pnl_net: -2.5
- snapshot_at: [Data atual]
```

Agora você verá a posição no Dashboard e na página de Posições!

## 🎨 Próximos Passos

Depois de verificar que tudo está funcionando:

1. **Implementar o Modal de Abrir Posição** (formulário completo)
2. **Adicionar os gráficos** (Recharts)
3. **Implementar o Modal de Fechar Posição**
4. **Configurar o Background Job** para criar snapshots automaticamente

Veja `IMPLEMENTATION.md` para mais detalhes sobre o que falta implementar.

---

**Dúvidas?** Verifique o README.md ou o IMPLEMENTATION.md para mais detalhes!