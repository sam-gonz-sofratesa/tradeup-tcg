import { Schema, model, Document, Types } from 'mongoose'

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface ICatalogRequest extends Document {
  requestedBy: Types.ObjectId
  game: string
  name: string
  set: string
  cardNumber: string
  rarity: string
  notes?: string
  status: RequestStatus
  createdAt: Date
  updatedAt: Date
}

const CatalogRequestSchema = new Schema<ICatalogRequest>({
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  game: { type: String, required: true },
  name: { type: String, required: true },
  set: { type: String, required: true },
  cardNumber: { type: String, required: true },
  rarity: { type: String, required: true },
  notes: { type: String },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
}, { timestamps: true })

export const CatalogRequest = model<ICatalogRequest>('CatalogRequest', CatalogRequestSchema)
