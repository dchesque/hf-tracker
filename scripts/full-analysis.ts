import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function fullAnalysis() {
  console.log('═'.repeat(70))
  console.log('🔍 ANÁLISE COMPLETA DO APP E SUPABASE')
  console.log('═'.repeat(70))

  console.log('\n📊 1. ESTRUTURA DO BANCO DE DADOS\n')

  const tables = [
    { name: 'coins', desc: 'Moedas disponíveis' },
    { name: 'funding_rates', desc: 'Histórico de funding rates' },
    { name: 'coin_markets', desc: 'Mercados e exchanges' },
    { name: 'positions', desc: 'Posições abertas/fechadas' },
    { name: 'position_snapshots', desc: 'Histórico de P&L' },
    { name: 'position_alerts', desc: 'Alertas configurados' },
    { name: 'user_settings', desc: 'Preferências do usuário' }
  ]

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ ${table.name.padEnd(20)} - ERRO: ${error.message}`)
    } else {
      const status = count === 0 ? '⚪' : '✅'
      console.log(`${status} ${table.name.padEnd(20)} - ${String(count).padStart(5)} registros - ${table.desc}`)
    }
  }

  console.log('\n📊 2. FUNÇÃO RPC\n')

  const { data: rpcData, error: rpcError } = await supabase.rpc('get_latest_funding_rates')

  if (rpcError) {
    console.log(`❌ get_latest_funding_rates  - NÃO EXISTE`)
    console.log(`   Erro: ${rpcError.message}`)
  } else {
    console.log(`✅ get_latest_funding_rates  - ${rpcData?.length || 0} moedas retornadas`)
  }

  console.log('\n📊 3. ANÁLISE DE DADOS\n')

  const { data: latestFunding } = await supabase
    .from('funding_rates')
    .select('scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(1)
    .single()

  if (latestFunding) {
    const lastUpdate = new Date(latestFunding.scraped_at)
    const now = new Date()
    const diffMs = now.getTime() - lastUpdate.getTime()
    const diffMins = Math.floor(diffMs / 1000 / 60)

    console.log(`⏱️  Última atualização de funding rates: ${lastUpdate.toLocaleString('pt-BR')}`)
    console.log(`   (${diffMins} minutos atrás)`)
  }

  const { data: topRates } = await supabase
    .from('funding_rates')
    .select('coin, hyperliquid_rate, hyperliquid_oi')
    .order('scraped_at', { ascending: false })
    .order('hyperliquid_rate', { ascending: false })
    .limit(5)

  if (topRates && topRates.length > 0) {
    console.log('\n🔥 Top 5 Funding Rates (recentes):')
    topRates.forEach((r: any, i: number) => {
      const rate = (Number(r.hyperliquid_rate) * 100).toFixed(4)
      const oi = (Number(r.hyperliquid_oi) / 1000000).toFixed(2)
      console.log(`   ${i + 1}. ${r.coin.padEnd(8)} - ${rate.padStart(8)}% | OI: $${oi}M`)
    })
  }

  console.log('\n📊 4. ESTRUTURA DAS COLUNAS\n')

  const { data: fundingRate } = await supabase
    .from('funding_rates')
    .select('*')
    .limit(1)
    .single()

  if (fundingRate) {
    console.log('✅ funding_rates tem', Object.keys(fundingRate).length, 'colunas:')
    console.log('   ', Object.keys(fundingRate).join(', '))
  }

  const { data: position } = await supabase
    .from('positions')
    .select('*')
    .limit(1)
    .single()

  if (position) {
    console.log('\n✅ positions tem', Object.keys(position).length, 'colunas:')
    console.log('   ', Object.keys(position).join(', '))
  } else {
    console.log('\n⚪ positions está vazia (nenhuma posição criada ainda)')
  }

  console.log('\n📊 5. VERIFICAÇÃO DE INTEGRIDADE\n')

  try {
    const { data: coinsWithoutMarkets } = await supabase.rpc('count_coins_without_markets' as any)
    if (coinsWithoutMarkets) {
      console.log('⚠️  Moedas sem mercado:', coinsWithoutMarkets)
    }
  } catch (error) {
    console.log('⚠️  Função count_coins_without_markets não existe')
  }

  const { data: orphanFundingRates } = await supabase
    .from('funding_rates')
    .select('coin')
    .is('coin_id', null)
    .limit(1)

  if (orphanFundingRates && orphanFundingRates.length > 0) {
    console.log('⚠️  Há funding_rates sem coin_id (órfãos)')
  } else {
    console.log('✅ Todos os funding_rates têm coin_id associado')
  }

  console.log('\n═'.repeat(70))
  console.log('✅ ANÁLISE CONCLUÍDA')
  console.log('═'.repeat(70))
}

fullAnalysis().catch(console.error)