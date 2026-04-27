#!/usr/bin/env bun
/**
 * seed-catalog.ts
 * Pobla la coleccion CatalogCard con cartas reales.
 *
 * Fuentes:
 *   - Pokemon: https://api.pokemontcg.io/v2  (gratis, sin key para rate limit bajo)
 *   - Yu-Gi-Oh!: https://db.ygoprodeck.com/api/v7  (gratis, sin key)
 *
 * Uso:
 *   cd tradeup-tcg
 *   bun scripts/seed-catalog.ts
 *
 * Variables de entorno necesarias (toma las del apps/api/.env):
 *   MONGODB_URI
 */

import mongoose from 'mongoose'
import { CatalogCard } from '../packages/db/src/index.js'

// ─── Config ────────────────────────────────────────────────────────────────────
const MONGODB_URI =
  process.env['MONGODB_URI'] ??
  (() => { throw new Error('MONGODB_URI not set. Copia apps/api/.env o exporta la variable.') })()

const POKEMON_SETS = [
  'base1',   // Base Set
  'neo1',    // Neo Genesis
  'ex1',     // EX Ruby & Sapphire
  'dp1',     // Diamond & Pearl
  'bw1',     // Black & White
  'xy1',     // XY
  'sm1',     // Sun & Moon
  'swsh1',   // Sword & Shield
  'sv1',     // Scarlet & Violet
  'sv4',     // Paradox Rift
  'sv5',     // Temporal Forces
]

// ─── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function pokemonRarity(raw: string | undefined): string {
  if (!raw) return 'other'
  const r = raw.toLowerCase()
  if (r.includes('secret')) return 'secret_rare'
  if (r.includes('ultra')) return 'ultra_rare'
  if (r.includes('rare holo') || r.includes('rare v') || r.includes('rare ex')) return 'ultra_rare'
  if (r.includes('super')) return 'super_rare'
  if (r.includes('rare')) return 'rare'
  if (r.includes('uncommon')) return 'uncommon'
  if (r.includes('common')) return 'common'
  if (r.includes('promo')) return 'promo'
  return 'other'
}

function yugiohRarity(raw: string | undefined): string {
  if (!raw) return 'other'
  const r = raw.toLowerCase()
  if (r.includes('secret')) return 'secret_rare'
  if (r.includes('ultra')) return 'ultra_rare'
  if (r.includes('super')) return 'super_rare'
  if (r.includes('rare')) return 'rare'
  if (r.includes('common')) return 'common'
  return 'other'
}

// ─── Pokemon fetcher ───────────────────────────────────────────────────────────
async function fetchPokemonSet(setId: string): Promise<any[]> {
  const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250`
  console.log(`  Fetching Pokemon set: ${setId}`)
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  ⚠️  Pokemon API error ${res.status} for set ${setId}`)
    return []
  }
  const json = await res.json() as { data: any[] }
  return json.data ?? []
}

async function seedPokemon() {
  let total = 0
  for (const setId of POKEMON_SETS) {
    const cards = await fetchPokemonSet(setId)
    const docs = cards.map((c: any) => ({
      game: 'pokemon',
      name: c.name,
      set: c.set?.name ?? setId,
      setCode: c.set?.id ?? setId,
      cardNumber: c.number ?? '0',
      rarity: pokemonRarity(c.rarity),
      imageUrl: c.images?.small ?? c.images?.large,
      language: 'en',
    }))

    if (docs.length > 0) {
      await CatalogCard.insertMany(docs, { ordered: false }).catch((e) => {
        // ignore duplicate key errors
        if (e.code !== 11000) console.warn('  Insert warn:', e.message)
      })
      total += docs.length
      console.log(`  ✅ ${setId}: ${docs.length} cartas insertadas`)
    }
    await sleep(300) // rate limit gentil
  }
  return total
}

// ─── Yu-Gi-Oh! fetcher ─────────────────────────────────────────────────────────
async function seedYugioh() {
  // YGOProDeck devuelve todas las cartas de golpe
  const ARCHETYPES = [
    'Blue-Eyes', 'Dark Magician', 'Elemental HERO', 'Blackwing',
    'Dragon Ruler', 'Nekroz', 'Qliphort', 'Pendulum', 'Salamangreat', 'Eldlich',
  ]

  let total = 0
  for (const archetype of ARCHETYPES) {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${encodeURIComponent(archetype)}&num=100&offset=0`
    console.log(`  Fetching YGO archetype: ${archetype}`)
    const res = await fetch(url)
    if (!res.ok) { console.warn(`  ⚠️  YGO error ${res.status}`); continue }
    const json = await res.json() as { data: any[] }
    const cards = json.data ?? []

    const docs = cards.flatMap((c: any) => {
      // Cada carta tiene card_sets con info de rareza y set
      const sets: any[] = c.card_sets ?? []
      if (sets.length === 0) {
        return [{
          game: 'yugioh',
          name: c.name,
          set: 'Unknown Set',
          setCode: 'YGO',
          cardNumber: String(c.id),
          rarity: 'other',
          imageUrl: c.card_images?.[0]?.image_url_small ?? c.card_images?.[0]?.image_url,
          language: 'en',
        }]
      }
      // Toma hasta 3 sets por carta para no explotar la coleccion
      return sets.slice(0, 3).map((s: any) => ({
        game: 'yugioh',
        name: c.name,
        set: s.set_name ?? 'Unknown',
        setCode: s.set_code ?? 'YGO',
        cardNumber: s.set_code ?? String(c.id),
        rarity: yugiohRarity(s.set_rarity),
        imageUrl: c.card_images?.[0]?.image_url_small ?? c.card_images?.[0]?.image_url,
        language: 'en',
      }))
    })

    if (docs.length > 0) {
      await CatalogCard.insertMany(docs, { ordered: false }).catch((e) => {
        if (e.code !== 11000) console.warn('  Insert warn:', e.message)
      })
      total += docs.length
      console.log(`  ✅ ${archetype}: ${docs.length} entradas insertadas`)
    }
    await sleep(500)
  }
  return total
}

// ─── One Piece — cartas de muestra ────────────────────────────────────────────
async function seedOnePiece() {
  // La API oficial de One Piece TCG no es publica todavia.
  // Insertamos un set de muestra para que el juego aparezca en el catalogo.
  const sample = [
    { name: 'Monkey D. Luffy', set: 'Romance Dawn', cardNumber: 'OP01-060', rarity: 'secret_rare' },
    { name: 'Roronoa Zoro', set: 'Romance Dawn', cardNumber: 'OP01-001', rarity: 'super_rare' },
    { name: 'Nami', set: 'Romance Dawn', cardNumber: 'OP01-016', rarity: 'rare' },
    { name: 'Sanji', set: 'Romance Dawn', cardNumber: 'OP01-013', rarity: 'rare' },
    { name: 'Trafalgar Law', set: 'Paramount War', cardNumber: 'OP02-067', rarity: 'secret_rare' },
    { name: 'Portgas D. Ace', set: 'Paramount War', cardNumber: 'OP02-013', rarity: 'ultra_rare' },
    { name: 'Shanks', set: 'Pillars of Strength', cardNumber: 'OP03-121', rarity: 'secret_rare' },
    { name: 'Boa Hancock', set: 'Kingdoms of Intrigue', cardNumber: 'OP04-089', rarity: 'secret_rare' },
    { name: 'Yamato', set: 'Awakening of the New Era', cardNumber: 'OP05-118', rarity: 'ultra_rare' },
    { name: 'Eustass Kid', set: 'Wings of the Captain', cardNumber: 'OP06-048', rarity: 'super_rare' },
    { name: 'Blackbeard', set: 'Wings of the Captain', cardNumber: 'OP06-117', rarity: 'secret_rare' },
    { name: 'Rob Lucci', set: '500 Years in the Future', cardNumber: 'OP07-018', rarity: 'ultra_rare' },
    { name: 'Jewelry Bonney', set: '500 Years in the Future', cardNumber: 'OP07-063', rarity: 'secret_rare' },
  ]

  const docs = sample.map((c) => ({
    game: 'onepiece',
    name: c.name,
    set: c.set,
    setCode: c.cardNumber.split('-')[0] ?? 'OP01',
    cardNumber: c.cardNumber,
    rarity: c.rarity,
    imageUrl: undefined,
    language: 'en',
  }))

  await CatalogCard.insertMany(docs, { ordered: false }).catch(() => {})
  console.log(`  ✅ One Piece: ${docs.length} cartas de muestra insertadas`)
  return docs.length
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Conectando a MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado\n')

  // Limpiar catalogo existente (comentar si no quieres borrar)
  const existing = await CatalogCard.countDocuments()
  if (existing > 0) {
    console.log(`⚠️  Ya existen ${existing} cartas en el catalogo.`)
    console.log('   Agregando sin borrar (se saltaran duplicados)...\n')
  }

  console.log('📦 Seeding Pokemon TCG...')
  const pokemonCount = await seedPokemon()

  console.log('\n📦 Seeding Yu-Gi-Oh!...')
  const ygoCount = await seedYugioh()

  console.log('\n📦 Seeding One Piece TCG...')
  const opCount = await seedOnePiece()

  const total = pokemonCount + ygoCount + opCount
  console.log(`\n🎉 Seed completo: ${total} cartas insertadas en total`)
  console.log(`   Pokemon: ${pokemonCount}`)
  console.log(`   Yu-Gi-Oh!: ${ygoCount}`)
  console.log(`   One Piece: ${opCount}`)

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
