import { Schema, model, Document, Types } from 'mongoose'

export type TransactionType = 'c2c_money' | 'c2c_trade' | 'c2c_mixed' | 'b2c'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type ShippingStatus = 'pending' | 'preparing' | 'shipped' | 'delivered'

export interface ITransaction extends Document {
  offer?: Types.ObjectId
  buyer: Types.ObjectId
  seller?: Types.ObjectId          // null for B2C (TradeUp is merchant)
  isBuyerPurchase: boolean         // true = B2C store purchase
  type: TransactionType
  grossAmount?: number
  commissionAmount?: number
  netAmount?: number
  stripePaymentIntentId?: string
  stripeTransferId?: string
  status: TransactionStatus
  shippingStatus: ShippingStatus
  reviewEligible: boolean
  storeItemSnapshot?: {            // snapshot of item at purchase time
    name?: string
    imageUrl?: string
    condition?: string
    set?: string
    storeItemId?: string
  }
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>({
  offer: { type: Schema.Types.ObjectId, ref: 'Offer' },
  buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  isBuyerPurchase: { type: Boolean, default: false },
  type: { type: String, enum: ['c2c_money','c2c_trade','c2c_mixed','b2c'], required: true },
  grossAmount: { type: Number },
  commissionAmount: { type: Number },
  netAmount: { type: Number },
  stripePaymentIntentId: { type: String },
  stripeTransferId: { type: String },
  status: { type: String, enum: ['pending','completed','failed','refunded'], default: 'pending' },
  shippingStatus: { type: String, enum: ['pending','preparing','shipped','delivered'], default: 'pending' },
  reviewEligible: { type: Boolean, default: false },
  storeItemSnapshot: {
    name: String,
    imageUrl: String,
    condition: String,
    set: String,
    storeItemId: String,
  },
}, { timestamps: true })

export const Transaction = model<ITransaction>('Transaction', TransactionSchema)
