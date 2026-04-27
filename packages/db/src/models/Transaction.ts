import { Schema, model, Document, Types } from 'mongoose'

export type TransactionType = 'c2c_money' | 'c2c_trade' | 'c2c_mixed' | 'b2c'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface ITransaction extends Document {
  offer?: Types.ObjectId
  buyer: Types.ObjectId
  seller: Types.ObjectId          // TradeUp userId for B2C
  type: TransactionType
  grossAmount?: number            // in cents (money transactions)
  commissionAmount?: number       // 8% platform fee in cents
  netAmount?: number              // grossAmount - commission
  stripePaymentIntentId?: string
  stripeTransferId?: string
  status: TransactionStatus
  reviewEligible: boolean         // true after transaction completes
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>({
  offer: { type: Schema.Types.ObjectId, ref: 'Offer' },
  buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['c2c_money','c2c_trade','c2c_mixed','b2c'], required: true },
  grossAmount: { type: Number },
  commissionAmount: { type: Number },
  netAmount: { type: Number },
  stripePaymentIntentId: { type: String },
  stripeTransferId: { type: String },
  status: { type: String, enum: ['pending','completed','failed','refunded'], default: 'pending' },
  reviewEligible: { type: Boolean, default: false },
}, { timestamps: true })

export const Transaction = model<ITransaction>('Transaction', TransactionSchema)
