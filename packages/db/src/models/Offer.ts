import { Schema, model, Document, Types } from 'mongoose'

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'
export type OfferType = 'money' | 'cards' | 'mixed'

export interface IOffer extends Document {
  listing: Types.ObjectId         // the listing being offered on
  buyer: Types.ObjectId
  seller: Types.ObjectId
  type: OfferType
  moneyAmount?: number            // in cents
  offeredCards: Types.ObjectId[]  // Listing refs buyer offers
  stripePaymentIntentId?: string  // reserved when money is involved
  status: OfferStatus
  expiresAt: Date                 // +72h from creation
  createdAt: Date
  updatedAt: Date
}

const OfferSchema = new Schema<IOffer>({
  listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
  buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['money','cards','mixed'], required: true },
  moneyAmount: { type: Number },
  offeredCards: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
  stripePaymentIntentId: { type: String },
  status: { type: String, enum: ['pending','accepted','declined','cancelled','expired'], default: 'pending' },
  expiresAt: { type: Date, required: true },
}, { timestamps: true })

// Index for auto-expiry job
OfferSchema.index({ expiresAt: 1, status: 1 })

export const Offer = model<IOffer>('Offer', OfferSchema)
