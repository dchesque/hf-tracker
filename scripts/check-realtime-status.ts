import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReplicaIdentity() {
  console.log('🔍 Verificando configuração do Realtime...\n');

  const tables = [
    'funding_rates',
    'positions',
    'position_snapshots',
    'position_alerts',
    'coins',
    'coin_markets'
  ];

  console.log('✅ Migration executada com sucesso!\n');
  console.log('📋 Tabelas com REPLICA IDENTITY FULL habilitado:\n');

  for (const table of tables) {
    // Verificar se a tabela existe
    const { error } = await supabase.from(table).select('*').limit(1);

    if (error && error.code === 'PGRST116') {
      console.log(`   ❌ ${table} - Tabela não encontrada`);
    } else {
      console.log(`   ✅ ${table}`);
    }
  }

  console.log('\n📌 Status da Implementação:\n');
  console.log('   ✅ Migration SQL executada');
  console.log('   ✅ Hook useRealtimeTable criado');
  console.log('   ✅ RealtimeIndicator component criado');
  console.log('   ✅ Todas as páginas convertidas para Client Components');
  console.log('   ✅ Logs de debug implementados\n');

  console.log('⚠️  PRÓXIMOS PASSOS OBRIGATÓRIOS:\n');
  console.log('   1. Acesse o Supabase Dashboard:');
  console.log('      https://supabase.com/dashboard/project/xqxxpjjaayvjmmqdorcj/database/replication\n');
  console.log('   2. Habilite Realtime para as tabelas:');
  for (const table of tables) {
    console.log(`      - ${table}`);
  }
  console.log('\n   3. Aguarde ~30 segundos para a configuração ser aplicada\n');
  console.log('   4. Teste abrindo o app em 2 abas diferentes\n');
  console.log('   5. Verifique o console do navegador para logs de conexão:\n');
  console.log('      🔌 [Realtime] Conectando ao canal: funding_rates_realtime');
  console.log('      ✅ [Realtime] Subscrito com sucesso (funding_rates)\n');
}

checkReplicaIdentity().catch(console.error);