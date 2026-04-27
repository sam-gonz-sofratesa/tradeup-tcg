#!/usr/bin/env bun
/**
 * seed-demo.ts
 * Crea datos de demo para el marketplace y la tienda oficial.
 * Requiere que seed-catalog.ts ya haya corrido (necesita CatalogCards existentes).
 *
 * Uso:
 *   $env:MONGODB_URI = "mongodb://localhost:27017/tradeup"
 *   bun scripts/seed-demo.ts
 */

import mongoose from 'mongoose'
import { CatalogCard, Listing, StoreItem, User } from '../packages/db/src/index.js'

const MONGODB_URI =
  process.env['MONGODB_URI'] ??
  (() => { throw new Error('MONGODB_URI no definido') })()

// ─── Sellers de demo ────────────────────────────────────────────────────────────
const DEMO_SELLERS = [
  { clerkId: 'demo_seed_01', username: 'PokeTrader_MX',  email: 'trader1@demo.tradeup', reputation: 4.9, reviewCount: 142, role: 'seller' },
  { clerkId: 'demo_seed_02', username: 'YGO_Campeón',    email: 'trader2@demo.tradeup', reputation: 4.7, reviewCount: 87,  role: 'seller' },
  { clerkId: 'demo_seed_03', username: 'OpCardsPanama',  email: 'trader3@demo.tradeup', reputation: 4.8, reviewCount: 56,  role: 'seller' },
  { clerkId: 'demo_seed_04', username: 'RareFinderCR',   email: 'trader4@demo.tradeup', reputation: 4.5, reviewCount: 34,  role: 'seller' },
  { clerkId: 'demo_seed_05', username: 'ColeccionistaBO', email: 'trader5@demo.tradeup', reputation: 5.0, reviewCount: 21, role: 'seller' },
]

const CONDITIONS: Array<'mint' | 'near_mint' | 'excellent' | 'good' | 'played'> =
  ['mint', 'near_mint', 'near_mint', 'excellent', 'good', 'played']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function randPrice(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100)
}

// ─── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Conectando...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado\n')

  // 1. Verificar que hay cartas en el catálogo
  const catalogCount = await CatalogCard.countDocuments()
  if (catalogCount === 0) {
    console.error('❌ El catálogo está vacío. Corre seed-catalog.ts primero.')
    process.exit(1)
  }
  console.log(`📚 Catálogo: ${catalogCount} cartas disponibles`)

  // 2. Crear / recuperar sellers de demo
  console.log('\n👥 Creando sellers de demo...')
  const sellerDocs = await Promise.all(
    DEMO_SELLERS.map((s) =>
      User.findOneAndUpdate(
        { clerkId: s.clerkId },
        { $setOnInsert: { ...s, stripeConnectStatus: 'none', isBanned: false } },
        { upsert: true, new: true }
      )
    )
  )
  console.log(`  ✅ ${sellerDocs.length} sellers listos`)

  // 3. Borrar listings y store items de demo anteriores
  await Listing.deleteMany({ seller: { $in: sellerDocs.map((s) => s!._id) } })
  await StoreItem.deleteMany({ isActive: true, stock: { $gte: 1 } })
  console.log('  🗑  Listings y StoreItems anteriores limpiados')

  // 4. Agarrar cartas del catálogo por juego
  const [pokeCards, ygoCards, opCards] = await Promise.all([
    CatalogCard.find({ game: 'pokemon' }).limit(60).lean(),
    CatalogCard.find({ game: 'yugioh' }).limit(40).lean(),
    CatalogCard.find({ game: 'onepiece' }).limit(13).lean(),
  ])

  const allCards = [...pokeCards, ...ygoCards, ...opCards]
  console.log(`\n🃏 Cartas para seed: Pokemon=${pokeCards.length} YGO=${ygoCards.length} OP=${opCards.length}`)

  if (allCards.length === 0) {
    console.error('❌ No se encontraron cartas. Corre seed-catalog.ts primero.')
    process.exit(1)
  }

  // ─── 5. Marketplace listings (30 listings variados) ─────────────────────────
  console.log('\n🛒 Creando listings del marketplace...')
  const listingDocs = []

  // Repartir cartas entre sellers
  for (let i = 0; i < 30; i++) {
    const card = allCards[i % allCards.length]!
    const seller = sellerDocs[i % sellerDocs.length]!
    const condition = pick(CONDITIONS)

    // Mezclar tipos: con precio, solo trade, o ambos
    const type = i % 3
    const askingPrice =
      type === 0 ? randPrice(1, 80)    // solo dinero
      : type === 1 ? undefined          // solo trade
      : randPrice(0.5, 30)             // precio + acepta trade

    listingDocs.push({
      seller: seller._id,
      catalogCard: card._id,
      condition,
      photos: [],           // en demo no hay fotos reales
      askingPrice,
      wantsCards: [],
      status: 'active',
      views: Math.floor(Math.random() * 200),
    })
  }

  await Listing.insertMany(listingDocs)
  console.log(`  ✅ ${listingDocs.length} listings creados`)

  // ─── 6. Store items (20 items de tienda oficial) ─────────────────────────────
  console.log('\n🏪 Creando items de la tienda oficial...')
  const storeDocs = []

  // 12 singles normales
  for (let i = 0; i < 12; i++) {
    const card = allCards[i]!
    storeDocs.push({
      catalogCard: card._id,
      condition: pick(['mint', 'near_mint'] as const),
      photos: [],
      price: randPrice(5, 150),
      stock: Math.floor(Math.random() * 3) + 1,
      isGraded: false,
      isSealed: false,
      isActive: true,
    })
  }

  // 5 cartas gradeadas (PSA / BGS)
  const gradedCards = [...pokeCards].sort(() => Math.random() - 0.5).slice(0, 5)
  for (const card of gradedCards) {
    const grade = pick([7, 8, 9, 9.5, 10])
    storeDocs.push({
      catalogCard: card._id,
      condition: 'mint',
      photos: [],
      price: randPrice(80, 500),
      stock: 1,
      isGraded: true,
      gradeValue: grade,
      gradeCompany: pick(['PSA', 'BGS', 'CGC']),
      isSealed: false,
      isActive: true,
    })
  }

  // 3 sellados
  const sealedItems = [
    { name: 'Scarlet & Violet Booster Box', set: 'Scarlet & Violet', game: 'pokemon' },
    { name: 'Paradox Rift Booster Box', set: 'Paradox Rift', game: 'pokemon' },
    { name: 'Awakening of the New Era Booster Box', set: 'Awakening of the New Era', game: 'onepiece' },
  ]
  for (const item of sealedItems) {
    // Buscar o crear una carta de catálogo de referencia
    let refCard = await CatalogCard.findOne({ game: item.game, set: { $regex: item.set.split(' ')[0]!, $options: 'i' } }).lean()
    if (!refCard) refCard = allCards[0]!
    storeDocs.push({
      catalogCard: (refCard as any)._id,
      condition: 'mint',
      photos: [],
      price: randPrice(80, 200),
      stock: Math.floor(Math.random() * 5) + 1,
      isGraded: false,
      isSealed: true,
      isActive: true,
    })
  }

  await StoreItem.insertMany(storeDocs)
  console.log(`  ✅ ${storeDocs.length} store items creados (12 singles + 5 gradeados + 3 sellados)`)

  // ─── Resumen ─────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed demo completo:')
  console.log(`   Marketplace : ${listingDocs.length} listings`)
  console.log(`   Tienda      : ${storeDocs.length} items`)
  console.log(`   Sellers demo: ${sellerDocs.length} usuarios`)
  console.log('\n👉 Abre http://localhost:3000/marketplace y http://localhost:3000/store')

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
