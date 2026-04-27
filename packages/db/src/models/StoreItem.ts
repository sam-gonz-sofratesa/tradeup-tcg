import { Schema, model, Document, Types } from 'mongoose'

export interface IStoreItem extends Document {
  catalogCard: Types.ObjectId
  condition: string
  photos: string[]
  price: number           // in cents
  stock: number
  isGraded: boolean
  gradeValue?: number     // e.g. PSA 10
  gradeCompany?: string
  isSealed: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const StoreItemSchema = new Schema<IStoreItem>({
  catalogCard: { type: Schema.Types.ObjectId, ref: 'CatalogCard', required: true },
  condition: { type: String, required: true },
  photos: [{ type: String }],
  price: { type: Number, required: true },
  stock: { type: Number, default: 1 },
  isGraded: { type: Boolean, default: false },
  gradeValue: { type: Number },
  gradeCompany: { type: String },
  isSealed: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

export const StoreItem = model<IStoreItem>('StoreItem', StoreItemSchema)
