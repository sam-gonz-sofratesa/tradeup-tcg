import { Schema, model, Document } from 'mongoose'

export interface IUser extends Document {
  clerkId: string
  username: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
  stripeConnectAccountId?: string
  stripeConnectStatus: 'none' | 'pending' | 'active'
  reputation: number
  reviewCount: number
  isBanned: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  stripeConnectAccountId: { type: String },
  stripeConnectStatus: { type: String, enum: ['none', 'pending', 'active'], default: 'none' },
  reputation: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true })

export const User = model<IUser>('User', UserSchema)
