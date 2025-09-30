import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Verificando banco de dados...\n')

    // Verificar tabelas existentes
    console.log('📊 TABELAS EXISTENTES:')

    // Coins
    const coinsCount = await prisma.coin.count()
    console.log(`✅ coins: ${coinsCount} registros`)

    // Funding Rates
    const fundingRatesCount = await prisma.fundingRate.count()
    const latestFundingRate = await prisma.fundingRate.findFirst({
      orderBy: { scrapedAt: 'desc' },
      select: { scrapedAt: true }
    })
    console.log(`✅ funding_rates: ${fundingRatesCount} registros`)
    console.log(`   Último scraping: ${latestFundingRate?.scrapedAt || 'N/A'}`)

    // Coin Markets
    const coinMarketsCount = await prisma.coinMarket.count()
    console.log(`✅ coin_markets: ${coinMarketsCount} registros`)

    // Positions
    const positionsCount = await prisma.position.count()
    const openPositions = await prisma.position.count({ where: { status: 'open' } })
    const closedPositions = await prisma.position.count({ where: { status: 'closed' } })
    console.log(`✅ positions: ${positionsCount} registros (${openPositions} abertas, ${closedPositions} fechadas)`)

    // Snapshots
    const snapshotsCount = await prisma.positionSnapshot.count()
    console.log(`✅ position_snapshots: ${snapshotsCount} registros`)

    // Alerts
    const alertsCount = await prisma.positionAlert.count()
    console.log(`✅ position_alerts: ${alertsCount} registros`)

    // User Settings
    const userSettingsCount = await prisma.userSettings.count()
    console.log(`✅ user_settings: ${userSettingsCount} registros`)

    console.log('\n📈 ANÁLISE DE DADOS:')

    // Top 10 moedas com maior funding rate
    const topFundingRates = await prisma.$queryRaw<Array<{
      coin: string;
      hyperliquid_rate: number;
      hyperliquid_oi: number;
      scraped_at: Date;
    }>>`
      SELECT DISTINCT ON (coin)
        coin,
        hyperliquid_rate,
        hyperliquid_oi,
        scraped_at
      FROM funding_rates
      WHERE hyperliquid_rate IS NOT NULL
      ORDER BY coin, scraped_at DESC
      LIMIT 10
    `

    console.log('\nTop 10 Moedas por Funding Rate:')
    topFundingRates.forEach((rate, index) => {
      const percentage = (Number(rate.hyperliquid_rate) * 100).toFixed(4)
      const oi = Number(rate.hyperliquid_oi)
      console.log(`${index + 1}. ${rate.coin}: ${percentage}% | OI: $${(oi / 1_000_000).toFixed(2)}M`)
    })

    // Verificar se há posições abertas
    if (openPositions > 0) {
      console.log('\n💼 POSIÇÕES ABERTAS:')
      const positions = await prisma.position.findMany({
        where: { status: 'open' },
        include: {
          coin: { select: { symbol: true, name: true } },
          snapshots: {
            orderBy: { snapshotAt: 'desc' },
            take: 1
          }
        },
        take: 5
      })

      positions.forEach((pos, index) => {
        console.log(`\n${index + 1}. ${pos.coinSymbol}`)
        console.log(`   Capital: $${Number(pos.totalCapital).toFixed(2)}`)
        console.log(`   P&L: $${Number(pos.pnlNet).toFixed(2)} (${Number(pos.pnlPercentage).toFixed(2)}%)`)
        console.log(`   Funding Acumulado: $${Number(pos.fundingAccumulated).toFixed(2)}`)
      })
    } else {
      console.log('\n⚠️  Nenhuma posição aberta no momento')
    }

    console.log('\n✅ Verificação concluída!')

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()