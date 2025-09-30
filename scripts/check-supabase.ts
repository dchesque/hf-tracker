import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Verificando conexão com Supabase...\n')

  const { data: coins, error: coinsError } = await supabase
    .from('coins')
    .select('id, symbol, name')
    .limit(5)

  if (coinsError) {
    console.error('❌ Erro ao buscar coins:', coinsError)
  } else {
    console.log(`✅ Coins: ${coins?.length || 0} registros encontrados`)
    console.log(coins)
  }

  const { data: fundingRates, error: frError } = await supabase
    .from('funding_rates')
    .select('coin, hyperliquid_rate, scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(5)

  if (frError) {
    console.error('❌ Erro ao buscar funding_rates:', frError)
  } else {
    console.log(`\n✅ Funding Rates: ${fundingRates?.length || 0} registros recentes`)
    console.log(fundingRates)
  }

  const { data: positions, error: posError } = await supabase
    .from('positions')
    .select('*')
    .limit(5)

  if (posError) {
    console.error('❌ Erro ao buscar positions:', posError)
  } else {
    console.log(`\n✅ Positions: ${positions?.length || 0} registros`)
    console.log(positions)
  }

  console.log('\n✅ Verificação concluída!')
}

checkDatabase().catch(console.error)