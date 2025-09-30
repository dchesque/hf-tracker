import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  console.log('🔍 Verificando estrutura das colunas...\n')

  console.log('📊 TABELA: funding_rates')
  console.log('Colunas que o app espera:')
  console.log('  - coin, hyperliquid_oi, hyperliquid_rate')
  console.log('  - binance_rate, bybit_rate')
  console.log('  - binance_hl_arb, bybit_hl_arb')
  console.log('  - scraped_at\n')

  const { data: fundingRate } = await supabase
    .from('funding_rates')
    .select('*')
    .limit(1)
    .single()

  if (fundingRate) {
    console.log('Colunas existentes no banco:')
    console.log('  ', Object.keys(fundingRate).join(', '))
  }

  console.log('\n📊 TABELA: coins')
  console.log('Colunas que o app espera:')
  console.log('  - id, symbol, name, coingecko_id, is_active\n')

  const { data: coin } = await supabase
    .from('coins')
    .select('*')
    .limit(1)
    .single()

  if (coin) {
    console.log('Colunas existentes no banco:')
    console.log('  ', Object.keys(coin).join(', '))
  }

  console.log('\n📊 TABELA: positions')
  console.log('Colunas que o app espera:')
  console.log('  - id, user_id, coin_id, coin_symbol, status')
  console.log('  - total_capital, short_amount, short_entry_price, short_size')
  console.log('  - short_entry_funding_rate, short_exit_price')
  console.log('  - spot_amount, spot_exchange, spot_entry_price, spot_quantity')
  console.log('  - spot_exit_price, trading_fees, closing_fees')
  console.log('  - funding_accumulated, pnl_net, pnl_percentage')
  console.log('  - opened_at, closed_at, notes\n')

  const { data: position } = await supabase
    .from('positions')
    .select('*')
    .limit(1)
    .single()

  if (position) {
    console.log('Colunas existentes no banco:')
    console.log('  ', Object.keys(position).join(', '))
  } else {
    console.log('❓ Não há registros para verificar colunas')
  }

  console.log('\n📊 TABELA: coin_markets')
  const { data: market } = await supabase
    .from('coin_markets')
    .select('*')
    .limit(1)
    .single()

  if (market) {
    console.log('Colunas existentes no banco:')
    console.log('  ', Object.keys(market).join(', '))
  }
}

checkColumns().catch(console.error)