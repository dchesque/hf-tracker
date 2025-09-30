# Deploy no Easypanel

Este guia explica como fazer deploy da aplicação HF Tracker no Easypanel usando Docker.

## Pré-requisitos

1. Conta no Easypanel
2. VPS configurada com Easypanel instalado
3. Variáveis de ambiente do Supabase configuradas

## Arquivos criados

- `Dockerfile` - Configuração Docker otimizada para Next.js
- `.dockerignore` - Arquivos excluídos do build
- `docker-compose.yml` - Configuração para rodar localmente com Docker
- `next.config.ts` - Atualizado com `output: 'standalone'`

## Passo a passo no Easypanel

### 1. Criar novo projeto

1. Acesse seu painel do Easypanel
2. Clique em "Create Project"
3. Escolha "App from GitHub" ou "App from Source"

### 2. Configurar repositório

Se usar GitHub:
1. Conecte seu repositório
2. Selecione a branch (main/master)
3. O Easypanel detectará automaticamente o Dockerfile

### 3. Configurar variáveis de ambiente

No painel do Easypanel, adicione as seguintes variáveis:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### 4. Configurar domínio

1. Na aba "Domains", adicione seu domínio
2. Configure SSL automático (Let's Encrypt)

### 5. Deploy

1. Clique em "Deploy"
2. Aguarde o build finalizar
3. A aplicação estará disponível no domínio configurado

## Build local com Docker (Opcional)

Para testar localmente antes do deploy:

```bash
# Build da imagem
docker build -t hf-tracker .

# Rodar com docker-compose
docker-compose up

# Ou rodar direto
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e NEXT_PUBLIC_SUPABASE_URL="your-supabase-url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  hf-tracker
```

## Troubleshooting

### Build falha

- Verifique se todas as variáveis de ambiente estão configuradas
- Certifique-se de que `output: 'standalone'` está em `next.config.ts`

### Aplicação não conecta ao Supabase

- Verifique se as URLs do Supabase estão corretas
- Confirme que a ANON_KEY está configurada corretamente

### Porta não responde

- Verifique se a porta 3000 está exposta corretamente no Easypanel
- Confirme que o container está rodando

## Recursos

- [Documentação Easypanel](https://easypanel.io/docs)
- [Next.js Docker](https://nextjs.org/docs/deployment#docker-image)
- [Supabase Docs](https://supabase.com/docs)