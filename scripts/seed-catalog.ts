#!/usr/bin/env bun
/**
 * seed-catalog.ts  (offline version)
 * Pobla CatalogCard con datos hardcodeados — sin fetch a APIs externas.
 *
 * Uso:
 *   bun --env-file=apps/api/.env scripts/seed-catalog.ts
 */

import mongoose from 'mongoose'
import { CatalogCard } from '../packages/db/src/index.js'

const MONGODB_URI =
  process.env['MONGODB_URI'] ??
  (() => { throw new Error('MONGODB_URI not set') })()

// ─── Pokémon ──────────────────────────────────────────────────────────────────
const POKEMON: any[] = [
  // Base Set
  { name: 'Charizard',        set: 'Base Set',        setCode: 'base1', cardNumber: '4',   rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png' },
  { name: 'Blastoise',        set: 'Base Set',        setCode: 'base1', cardNumber: '2',   rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/base1/2_hires.png' },
  { name: 'Venusaur',         set: 'Base Set',        setCode: 'base1', cardNumber: '15',  rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/base1/15_hires.png' },
  { name: 'Pikachu',          set: 'Base Set',        setCode: 'base1', cardNumber: '58',  rarity: 'common',       imageUrl: 'https://images.pokemontcg.io/base1/58_hires.png' },
  { name: 'Mewtwo',           set: 'Base Set',        setCode: 'base1', cardNumber: '10',  rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/base1/10_hires.png' },
  { name: 'Alakazam',         set: 'Base Set',        setCode: 'base1', cardNumber: '1',   rarity: 'rare',         imageUrl: 'https://images.pokemontcg.io/base1/1_hires.png' },
  { name: 'Gengar',           set: 'Base Set',        setCode: 'base1', cardNumber: '5',   rarity: 'rare',         imageUrl: 'https://images.pokemontcg.io/base1/5_hires.png' },
  { name: 'Nidoking',         set: 'Base Set',        setCode: 'base1', cardNumber: '11',  rarity: 'rare',         imageUrl: 'https://images.pokemontcg.io/base1/11_hires.png' },
  { name: 'Machamp',          set: 'Base Set',        setCode: 'base1', cardNumber: '8',   rarity: 'rare',         imageUrl: 'https://images.pokemontcg.io/base1/8_hires.png' },
  { name: 'Clefairy',         set: 'Base Set',        setCode: 'base1', cardNumber: '5',   rarity: 'rare',         imageUrl: 'https://images.pokemontcg.io/base1/5_hires.png' },
  // Sword & Shield
  { name: 'Charizard VMAX',   set: 'Darkness Ablaze', setCode: 'swsh3', cardNumber: '20',  rarity: 'secret_rare',  imageUrl: 'https://images.pokemontcg.io/swsh3/20_hires.png' },
  { name: 'Pikachu VMAX',     set: 'Vivid Voltage',   setCode: 'swsh4', cardNumber: '44',  rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/swsh4/44_hires.png' },
  { name: 'Umbreon VMAX',     set: 'Evolving Skies',  setCode: 'swsh7', cardNumber: '95',  rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/swsh7/95_hires.png' },
  { name: 'Rayquaza VMAX',    set: 'Evolving Skies',  setCode: 'swsh7', cardNumber: '111', rarity: 'secret_rare',  imageUrl: 'https://images.pokemontcg.io/swsh7/111_hires.png' },
  { name: 'Mew VMAX',         set: 'Fusion Strike',   setCode: 'swsh8', cardNumber: '114', rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/swsh8/114_hires.png' },
  // Scarlet & Violet
  { name: 'Charizard ex',     set: 'Obsidian Flames', setCode: 'sv3',   cardNumber: '125', rarity: 'secret_rare',  imageUrl: 'https://images.pokemontcg.io/sv3/125_hires.png' },
  { name: 'Gardevoir ex',     set: 'Scarlet & Violet',setCode: 'sv1',   cardNumber: '86',  rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/sv1/86_hires.png' },
  { name: 'Miraidon ex',      set: 'Scarlet & Violet',setCode: 'sv1',   cardNumber: '81',  rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/sv1/81_hires.png' },
  { name: 'Koraidon ex',      set: 'Scarlet & Violet',setCode: 'sv1',   cardNumber: '254', rarity: 'secret_rare',  imageUrl: 'https://images.pokemontcg.io/sv1/254_hires.png' },
  { name: 'Iono',             set: 'Paldea Evolved',  setCode: 'sv2',   cardNumber: '269', rarity: 'secret_rare',  imageUrl: 'https://images.pokemontcg.io/sv2/269_hires.png' },
  { name: 'Roaring Moon ex',  set: 'Paradox Rift',    setCode: 'sv4',   cardNumber: '229', rarity: 'secret_rare',  imageUrl: 'https://images.pokemontcg.io/sv4/229_hires.png' },
  { name: 'Iron Valiant ex',  set: 'Paradox Rift',    setCode: 'sv4',   cardNumber: '89',  rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/sv4/89_hires.png' },
  { name: 'Teal Mask Ogerpon ex', set: 'Twilight Masquerade', setCode: 'sv6', cardNumber: '25', rarity: 'ultra_rare', imageUrl: 'https://images.pokemontcg.io/sv6/25_hires.png' },
  { name: 'Pikachu',          set: 'Temporal Forces', setCode: 'sv5',   cardNumber: '67',  rarity: 'common',       imageUrl: 'https://images.pokemontcg.io/sv5/67_hires.png' },
  { name: 'Eevee',            set: 'Temporal Forces', setCode: 'sv5',   cardNumber: '129', rarity: 'common',       imageUrl: 'https://images.pokemontcg.io/sv5/129_hires.png' },
  // Neo Genesis
  { name: 'Lugia',            set: 'Neo Genesis',     setCode: 'neo1',  cardNumber: '9',   rarity: 'ultra_rare',   imageUrl: 'https://images.pokemontcg.io/neo1/9_hires.png' },
  { name: 'Typhlosion',       set: 'Neo Genesis',     setCode: 'neo1',  cardNumber: '17',  rarity: 'rare',         imageUrl: 'https://images.pokemontcg.io/neo1/17_hires.png' },
  { name: 'Feraligatr',       set: 'Neo Genesis',     setCode: 'neo1',  cardNumber: '5',   rarity: 'rare',         imageUrl: 'https://images.pokemontcg.io/neo1/5_hires.png' },
  { name: 'Meganium',         set: 'Neo Genesis',     setCode: 'neo1',  cardNumber: '10',  rarity: 'rare',         imageUrl: 'https://images.pokemontcg.io/neo1/10_hires.png' },
]

// ─── Yu-Gi-Oh! ────────────────────────────────────────────────────────────────
const YUGIOH: any[] = [
  // Iconic cards
  { name: 'Blue-Eyes White Dragon',      set: 'Legend of Blue Eyes White Dragon', setCode: 'LOB',  cardNumber: 'LOB-001',  rarity: 'ultra_rare',  imageUrl: 'https://images.ygoprodeck.com/images/cards/89631139.jpg' },
  { name: 'Dark Magician',               set: 'Legend of Blue Eyes White Dragon', setCode: 'LOB',  cardNumber: 'LOB-005',  rarity: 'ultra_rare',  imageUrl: 'https://images.ygoprodeck.com/images/cards/46986414.jpg' },
  { name: 'Exodia the Forbidden One',    set: 'Legend of Blue Eyes White Dragon', setCode: 'LOB',  cardNumber: 'LOB-003',  rarity: 'ultra_rare',  imageUrl: 'https://images.ygoprodeck.com/images/cards/33396948.jpg' },
  { name: 'Black Luster Soldier',        set: 'Metal Raiders',                    setCode: 'MRD',  cardNumber: 'MRD-000',  rarity: 'secret_rare', imageUrl: 'https://images.ygoprodeck.com/images/cards/5405694.jpg' },
  { name: 'Pot of Greed',                set: 'Legend of Blue Eyes White Dragon', setCode: 'LOB',  cardNumber: 'LOB-119',  rarity: 'rare',        imageUrl: 'https://images.ygoprodeck.com/images/cards/55144522.jpg' },
  { name: 'Mirror Force',                set: 'Metal Raiders',                    setCode: 'MRD',  cardNumber: 'MRD-138',  rarity: 'super_rare',  imageUrl: 'https://images.ygoprodeck.com/images/cards/44095762.jpg' },
  { name: 'Raigeki',                     set: 'Legend of Blue Eyes White Dragon', setCode: 'LOB',  cardNumber: 'LOB-053',  rarity: 'ultra_rare',  imageUrl: 'https://images.ygoprodeck.com/images/cards/12580477.jpg' },
  { name: 'Monster Reborn',              set: 'Legend of Blue Eyes White Dragon', setCode: 'LOB',  cardNumber: 'LOB-118',  rarity: 'rare',        imageUrl: 'https://images.ygoprodeck.com/images/cards/83764718.jpg' },
  // Modern meta
  { name: 'Ash Blossom & Joyous Spring', set: 'Maximum Crisis',                   setCode: 'MACR', cardNumber: 'MACR-JP036', rarity: 'secret_rare', imageUrl: 'https://images.ygoprodeck.com/images/cards/14558127.jpg' },
  { name: 'Nibiru, the Primal Being',    set: 'Rise of the Duelist',              setCode: 'ROTD', cardNumber: 'ROTD-EN013', rarity: 'secret_rare', imageUrl: 'https://images.ygoprodeck.com/images/cards/27204311.jpg' },
  { name: 'Infinite Impermanence',       set: 'Soul Fusion',                      setCode: 'SOFU', cardNumber: 'SOFU-EN000', rarity: 'secret_rare', imageUrl: 'https://images.ygoprodeck.com/images/cards/10045474.jpg' },
  { name: 'Accesscode Talker',           set: 'Rising Rampage',                   setCode: 'RIRA', cardNumber: 'RIRA-EN043', rarity: 'secret_rare', imageUrl: 'https://images.ygoprodeck.com/images/cards/86066372.jpg' },
  { name: 'Baronne de Fleur',            set: 'Burst of Destiny',                 setCode: 'BODE', cardNumber: 'BODE-EN038', rarity: 'secret_rare', imageUrl: 'https://images.ygoprodeck.com/images/cards/84815190.jpg' },
  { name: 'Tearlaments Kitkallos',       set: 'Power of the Elements',            setCode: 'POTE', cardNumber: 'POTE-EN006', rarity: 'secret_rare', imageUrl: 'https://images.ygoprodeck.com/images/cards/67977039.jpg' },
  { name: 'Kashtira Fenrir',             set: 'Darkwing Blast',                   setCode: 'DABL', cardNumber: 'DABL-EN008', rarity: 'secret_rare', imageUrl: 'https://images.ygoprodeck.com/images/cards/22409480.jpg' },
  // Blue-Eyes support
  { name: 'Blue-Eyes Alternative White Dragon', set: 'The Dark Side of Dimensions', setCode: 'TDIL', cardNumber: 'TDIL-EN006', rarity: 'secret_rare', imageUrl: 'https://images.ygoprodeck.com/images/cards/38517737.jpg' },
  { name: 'Blue-Eyes Chaos MAX Dragon', set: 'Chaos Impact',                      setCode: 'CHIM', cardNumber: 'CHIM-EN022', rarity: 'ultra_rare',  imageUrl: 'https://images.ygoprodeck.com/images/cards/55410871.jpg' },
  // Elemental HERO
  { name: 'Elemental HERO Flame Wingman', set: 'Soul of the Duelist',             setCode: 'SOD',  cardNumber: 'SOD-EN005',  rarity: 'ultra_rare',  imageUrl: 'https://images.ygoprodeck.com/images/cards/35809262.jpg' },
  { name: 'Elemental HERO Neos',          set: 'Enemy of Justice',                setCode: 'EOJ',  cardNumber: 'EOJ-EN001',  rarity: 'ultra_rare',  imageUrl: 'https://images.ygoprodeck.com/images/cards/89943723.jpg' },
]

// ─── One Piece ────────────────────────────────────────────────────────────────
const ONEPIECE: any[] = [
  { name: 'Monkey D. Luffy',    set: 'Romance Dawn',            setCode: 'OP01', cardNumber: 'OP01-060', rarity: 'secret_rare', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-060.png' },
  { name: 'Roronoa Zoro',       set: 'Romance Dawn',            setCode: 'OP01', cardNumber: 'OP01-001', rarity: 'super_rare',  imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png' },
  { name: 'Nami',               set: 'Romance Dawn',            setCode: 'OP01', cardNumber: 'OP01-016', rarity: 'rare',        imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-016.png' },
  { name: 'Sanji',              set: 'Romance Dawn',            setCode: 'OP01', cardNumber: 'OP01-013', rarity: 'rare',        imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-013.png' },
  { name: 'Trafalgar Law',      set: 'Paramount War',           setCode: 'OP02', cardNumber: 'OP02-067', rarity: 'secret_rare', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-067.png' },
  { name: 'Portgas D. Ace',     set: 'Paramount War',           setCode: 'OP02', cardNumber: 'OP02-013', rarity: 'ultra_rare',  imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-013.png' },
  { name: 'Shanks',             set: 'Pillars of Strength',     setCode: 'OP03', cardNumber: 'OP03-121', rarity: 'secret_rare', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP03-121.png' },
  { name: 'Boa Hancock',        set: 'Kingdoms of Intrigue',    setCode: 'OP04', cardNumber: 'OP04-089', rarity: 'secret_rare', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP04-089.png' },
  { name: 'Yamato',             set: 'Awakening of the New Era',setCode: 'OP05', cardNumber: 'OP05-118', rarity: 'ultra_rare',  imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-118.png' },
  { name: 'Eustass Kid',        set: 'Wings of the Captain',    setCode: 'OP06', cardNumber: 'OP06-048', rarity: 'super_rare',  imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP06-048.png' },
  { name: 'Blackbeard',         set: 'Wings of the Captain',    setCode: 'OP06', cardNumber: 'OP06-117', rarity: 'secret_rare', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP06-117.png' },
  { name: 'Rob Lucci',          set: '500 Years in the Future', setCode: 'OP07', cardNumber: 'OP07-018', rarity: 'ultra_rare',  imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP07-018.png' },
  { name: 'Jewelry Bonney',     set: '500 Years in the Future', setCode: 'OP07', cardNumber: 'OP07-063', rarity: 'secret_rare', imageUrl: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP07-063.png' },
]

// ─── Dragon Ball Super ────────────────────────────────────────────────────────
const DRAGONBALL: any[] = [
  { name: 'Son Goku, the Awakened Power', set: 'Galactic Battle',    setCode: 'BT01', cardNumber: 'BT1-031',  rarity: 'secret_rare', imageUrl: undefined },
  { name: 'Vegeta, Prince of Destruction',set: 'Galactic Battle',    setCode: 'BT01', cardNumber: 'BT1-030',  rarity: 'ultra_rare',  imageUrl: undefined },
  { name: 'Frieza, Emperor of the Universe', set: 'Union Force',     setCode: 'BT02', cardNumber: 'BT2-073',  rarity: 'ultra_rare',  imageUrl: undefined },
  { name: 'Gohan, Unlocked Potential',    set: 'Cross Worlds',       setCode: 'BT03', cardNumber: 'BT3-096',  rarity: 'secret_rare', imageUrl: undefined },
  { name: 'Broly, Surge of Power',        set: 'Colossal Warfare',   setCode: 'BT04', cardNumber: 'BT4-082',  rarity: 'ultra_rare',  imageUrl: undefined },
  { name: 'Ultra Instinct Goku',          set: 'Miraculous Revival',  setCode: 'BT05', cardNumber: 'BT5-038',  rarity: 'secret_rare', imageUrl: undefined },
  { name: 'Beerus, God of Destruction',   set: 'Destroyer Kings',    setCode: 'BT06', cardNumber: 'BT6-107',  rarity: 'super_rare',  imageUrl: undefined },
  { name: 'Jiren, All-or-Nothing',        set: 'Assault of the Saiyans', setCode: 'BT07', cardNumber: 'BT7-034', rarity: 'secret_rare', imageUrl: undefined },
]

// ─── MTG ──────────────────────────────────────────────────────────────────────
const MTG: any[] = [
  { name: 'Black Lotus',        set: 'Alpha',           setCode: 'LEA',  cardNumber: '232', rarity: 'rare',        imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg' },
  { name: 'Mox Ruby',           set: 'Alpha',           setCode: 'LEA',  cardNumber: '265', rarity: 'rare',        imageUrl: 'https://cards.scryfall.io/normal/front/d/4/d4328e5b-2b32-48db-b500-af6f2bbacd35.jpg' },
  { name: 'Ancestral Recall',   set: 'Alpha',           setCode: 'LEA',  cardNumber: '48',  rarity: 'rare',        imageUrl: 'https://cards.scryfall.io/normal/front/2/f/2f2e5b3a-b0f4-4e97-8c0e-e5394b3f4bd4.jpg' },
  { name: 'Jace, the Mind Sculptor', set: 'Worldwake',  setCode: 'WWK',  cardNumber: '31',  rarity: 'rare',        imageUrl: 'https://cards.scryfall.io/normal/front/8/9/8938aa3c-f734-46d7-a8d3-9b9b5c5a627a.jpg' },
  { name: 'Liliana of the Veil', set: 'Innistrad',      setCode: 'ISD',  cardNumber: '105', rarity: 'rare',        imageUrl: 'https://cards.scryfall.io/normal/front/e/2/e25ce640-baf5-442b-8301-8e72b9cdb6ac.jpg' },
  { name: 'Tarmogoyf',          set: 'Future Sight',    setCode: 'FUT',  cardNumber: '153', rarity: 'rare',        imageUrl: 'https://cards.scryfall.io/normal/front/0/e/0e9c8f3b-9b60-4e3c-9e02-d2a4e7b52e31.jpg' },
  { name: 'Force of Will',      set: 'Alliances',       setCode: 'ALL',  cardNumber: '1',   rarity: 'uncommon',    imageUrl: 'https://cards.scryfall.io/normal/front/b/f/bf7a46ea-7cb4-4da3-9ce5-a4fdc47d4a93.jpg' },
  { name: 'Ragavan, Nimble Pilferer', set: 'Modern Horizons 2', setCode: 'MH2', cardNumber: '138', rarity: 'rare', imageUrl: 'https://cards.scryfall.io/normal/front/a/9/a9a1f7bf-2b8e-4e63-b69e-2e23dab3f617.jpg' },
  { name: 'Wrenn and Six',      set: 'Modern Horizons', setCode: 'MH1',  cardNumber: '217', rarity: 'rare',        imageUrl: 'https://cards.scryfall.io/normal/front/5b/d5/5bd5cb91-d569-4e16-8e49-38ce43e42e93.jpg' },
  { name: 'Solitude',           set: 'Modern Horizons 2', setCode: 'MH2', cardNumber: '32', rarity: 'rare',        imageUrl: 'https://cards.scryfall.io/normal/front/4/3/43b31b7c-b425-4a2e-9df8-0dbbbfa94bcc.jpg' },
]

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Conectando a MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado\n')

  const existing = await CatalogCard.countDocuments()
  if (existing > 0) {
    console.log(`⚠️  Ya existen ${existing} cartas. Agregando sin borrar duplicados...\n`)
  }

  const allCards = [
    ...POKEMON.map(c => ({ ...c, game: 'pokemon',    language: 'en' })),
    ...YUGIOH.map(c  => ({ ...c, game: 'yugioh',     language: 'en' })),
    ...ONEPIECE.map(c => ({ ...c, game: 'onepiece',  language: 'en' })),
    ...DRAGONBALL.map(c => ({ ...c, game: 'dragonball', language: 'en' })),
    ...MTG.map(c    => ({ ...c, game: 'mtg',         language: 'en' })),
  ]

  await CatalogCard.insertMany(allCards, { ordered: false }).catch((e: any) => {
    if (e.code !== 11000) throw e
    console.log('  (algunos duplicados ignorados)')
  })

  const byGame = {
    'Pokémon':     POKEMON.length,
    'Yu-Gi-Oh!':   YUGIOH.length,
    'One Piece':   ONEPIECE.length,
    'Dragon Ball': DRAGONBALL.length,
    'MTG':         MTG.length,
  }

  const total = allCards.length
  console.log(`🎉 Seed completo — ${total} cartas insertadas`)
  Object.entries(byGame).forEach(([g, n]) => console.log(`   ${g}: ${n}`))

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
