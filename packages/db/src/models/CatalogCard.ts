import { Schema, model, Document } from 'mongoose'

export type TCGGame = 'pokemon' | 'yugioh' | 'onepiece' | 'dragonball' | 'mtg' | 'other'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'super_rare' | 'ultra_rare' | 'secret_rare' | 'promo' | 'other'

export interface ICatalogCard extends Document {
  game: TCGGame
  name: string
  set: string
  setCode: string
  cardNumber: string
  rarity: Rarity
  imageUrl?: string
  language: string
  createdAt: Date
  updatedAt: Date
}

const CatalogCardSchema = new Schema<ICatalogCard>({
  game: { type: String, enum: ['pokemon','yugioh','onepiece','dragonball','mtg','other'], required: true, index: true },
  name: { type: String, required: true, index: true },
  set: { type: String, required: true },
  setCode: { type: String, required: true },
  cardNumber: { type: String, required: true },
  rarity: { type: String, enum: ['common','uncommon','rare','super_rare','ultra_rare','secret_rare','promo','other'], required: true },
  imageUrl: { type: String },
  language: { type: String, default: 'en' },
}, { timestamps: true })

CatalogCardSchema.index({ name: 'text', set: 'text' }) // text search

export const CatalogCard = model<ICatalogCard>('CatalogCard', CatalogCardSchema)
