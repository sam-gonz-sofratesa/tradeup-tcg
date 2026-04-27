import { Schema, model, Document, Types } from 'mongoose'

export type ListingStatus = 'active' | 'sold' | 'traded' | 'cancelled' | 'expired'
export type CardCondition = 'mint' | 'near_mint' | 'excellent' | 'good' | 'played' | 'poor'

export interface IListing extends Document {
  seller: Types.ObjectId          // ref: User
  catalogCard: Types.ObjectId     // ref: CatalogCard
  condition: CardCondition
  photos: string[]                // relative paths: /uploads/uuid.jpg
  askingPrice?: number            // in cents; undefined = trade only
  wantsCards: Types.ObjectId[]    // CatalogCard refs the seller wants in trade
  status: ListingStatus
  views: number
  createdAt: Date
  updatedAt: Date
}

const ListingSchema = new Schema<IListing>({
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  catalogCard: { type: Schema.Types.ObjectId, ref: 'CatalogCard', required: true },
  condition: { type: String, enum: ['mint','near_mint','excellent','good','played','poor'], required: true },
  photos: [{ type: String }],
  askingPrice: { type: Number },
  wantsCards: [{ type: Schema.Types.ObjectId, ref: 'CatalogCard' }],
  status: { type: String, enum: ['active','sold','traded','cancelled','expired'], default: 'active' },
  views: { type: Number, default: 0 },
}, { timestamps: true })

export const Listing = model<IListing>('Listing', ListingSchema)
