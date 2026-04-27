# TradeUp — Architecture Overview

## Monorepo Structure

```
tradeup-tcg/
├── apps/
│   ├── web/          # Customer app — TanStack Start (port 3000)
│   ├── backoffice/   # Admin app — TanStack Start (port 3002)
│   └── api/          # Hono API server on Bun (port 3001)
├── packages/
│   ├── db/           # Mongoose models (shared by API)
│   ├── shared/       # Types, constants, utilities
│   └── ui/           # Design tokens & shared components
└── docs/
```

## Key Flows

### C2C Money Offer
1. Buyer creates offer with money amount
2. API creates Stripe PaymentIntent (manual capture), stores `stripePaymentIntentId` in Offer
3. Buyer's card is pre-authorized (hold)
4. Offer expires in 72h — if no response, API cancels PaymentIntent and releases hold
5. Seller accepts → API checks seller has active Stripe Connect
   - If not: redirect to `/api/users/me/stripe-onboard`
   - If yes: capture PaymentIntent, transfer net to seller via Connect, create Transaction

### C2C Trade (cards only)
1. Buyer includes listing IDs of their cards in offer
2. No Stripe involved — both listings marked `traded` on acceptance
3. No commission charged

### B2C Purchase
1. User clicks buy on StoreItem
2. API creates PaymentIntent (TradeUp as merchant, no Connect needed)
3. On success webhook: reduce stock, create Transaction, mark reviewEligible

## RBAC (Clerk)
| Role   | Capabilities |
|--------|-------------|
| buyer  | Browse, make offers, buy from store |
| seller | buyer + publish listings, accept/decline offers |
| admin  | Full access + backoffice |

## Commission Formula
```
commission = round(grossAmount * 0.08)
netToSeller = grossAmount - commission
```
Only applied when transaction involves money. Pure card trades: 0 commission.

## Image Storage
- **Dev**: `POST /api/listings` receives multipart; files saved to `apps/api/uploads/`, served as `/uploads/filename`
- **Prod**: Replace `saveFile()` in `apps/api/src/lib/storage.ts` with cloud upload. Path return signature unchanged.

## Offer Expiry Job
A cron/scheduled job (Bun's `setInterval` or a proper scheduler) should:
1. Query `Offer.find({ status: 'pending', expiresAt: { $lt: new Date() } })`
2. Cancel associated Stripe PaymentIntents
3. Set offer status to `expired`
