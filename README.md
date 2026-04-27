# 🃏 TradeUp — TCG Trading Platform

TradeUp is a web platform for trading and buying/selling physical trading card game (TCG) cards. Supports Pokémon, Yu-Gi-Oh!, One Piece, Dragon Ball, Magic: The Gathering, and more.

## Architecture

```
tradeup-tcg/
├── apps/
│   ├── web/          # Customer-facing app (TanStack Start)
│   ├── backoffice/   # Admin panel (TanStack Start)
│   └── api/          # Backend API (Hono on Bun)
├── packages/
│   ├── db/           # MongoDB schemas & models (Mongoose)
│   ├── shared/       # Shared types, utils, constants
│   └── ui/           # Shared UI components (shadcn-based)
└── docs/             # Architecture & API docs
```

## Business Models
- **C2C**: Users list cards and negotiate with offers (money, cards, or mixed)
- **B2C**: TradeUp official store sells graded/sealed cards directly

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | TanStack Start (React) |
| Backend | Hono on Bun |
| Database | MongoDB (Mongoose) |
| Auth | Clerk (RBAC: buyer, seller, admin) |
| Payments | Stripe + Stripe Connect |
| Images | Local `uploads/` (dev), external service (prod) |

## Getting Started

```bash
# Install dependencies
bun install

# Start all apps in development
bun run dev
```

## Environment Variables
See `.env.example` in each app folder.
