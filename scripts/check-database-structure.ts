import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseStructure() {
  console.log('🔍 Verificando estrutura do banco de dados...\n')

  const tablesToCheck = [
    'coins',
    'funding_rates',
    'coin_markets',
    'scraping_metadata',
    'arbitrage_alerts',
    'system_config',
    'positions',
    'position_snapshots',
    'position_alerts',
    'user_settings'
  ]

  console.log('📊 TABELAS NO SUPABASE:\n')

  for (const table of tablesToCheck) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ ${table.padEnd(25)} - NÃO EXISTE`)
      console.log(`   Erro: ${error.message}\n`)
    } else {
      console.log(`✅ ${table.padEnd(25)} - ${count || 0} registros`)
    }
  }

  console.log('\n🔍 Testando função RPC get_latest_funding_rates_instant...\n')

  const { data: rpcData, error: rpcError } = await supabase.rpc('get_latest_funding_rates_instant')

  if (rpcError) {
    console.log('❌ Função RPC get_latest_funding_rates_instant NÃO EXISTE')
    console.log(`   Erro: ${rpcError.message}`)
  } else {
    console.log(`✅ Função RPC get_latest_funding_rates_instant - ${rpcData?.length || 0} moedas retornadas`)
    if (rpcData && rpcData.length > 0) {
      console.log('   Primeiras 3 moedas:', rpcData.slice(0, 3).map((r: any) => r.coin))
    }
  }

  console.log('\n📋 RESUMO:')
  console.log('─'.repeat(60))
}

checkDatabaseStructure().catch(console.error)