import { Schema, model, Document, Types } from 'mongoose'

export interface IReview extends Document {
  transaction: Types.ObjectId
  reviewer: Types.ObjectId
  reviewee: Types.ObjectId
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  createdAt: Date
}

const ReviewSchema = new Schema<IReview>({
  transaction: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, enum: [1,2,3,4,5], required: true },
  comment: { type: String, maxlength: 500 },
}, { timestamps: { createdAt: true, updatedAt: false } })

// Prevent double review per transaction per reviewer
ReviewSchema.index({ transaction: 1, reviewer: 1 }, { unique: true })

export const Review = model<IReview>('Review', ReviewSchema)
