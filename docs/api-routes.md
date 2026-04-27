# TradeUp API Routes

Base URL: `http://localhost:3001`

## Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/sync` | ✅ | Sync Clerk user to MongoDB |

## Listings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/listings` | ❌ | Browse listings (filterable) |
| GET | `/api/listings/:id` | ❌ | Listing detail |
| POST | `/api/listings` | ✅ | Create listing (multipart) |
| PATCH | `/api/listings/:id` | ✅ | Update own listing |
| DELETE | `/api/listings/:id` | ✅ | Delete own listing |

## Offers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/offers` | ✅ | My sent/received offers |
| POST | `/api/offers` | ✅ | Create offer |
| POST | `/api/offers/:id/accept` | ✅ | Accept offer (seller) |
| POST | `/api/offers/:id/decline` | ✅ | Decline offer |
| POST | `/api/offers/:id/cancel` | ✅ | Cancel offer (buyer) |

## Catalog
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/catalog/search` | ❌ | Search cards |
| GET | `/api/catalog/:id` | ❌ | Card detail |
| POST | `/api/catalog` | 🔒 admin | Add card |
| PATCH | `/api/catalog/:id` | 🔒 admin | Edit card |
| DELETE | `/api/catalog/:id` | 🔒 admin | Delete card |
| POST | `/api/catalog/requests` | ✅ | Request card addition |
| GET | `/api/catalog/requests` | 🔒 admin | View requests |
| PATCH | `/api/catalog/requests/:id/approve` | 🔒 admin | Approve request |

## Store (B2C)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/store` | ❌ | Browse store |
| GET | `/api/store/:id` | ❌ | Item detail |
| POST | `/api/store/:id/buy` | ✅ | Purchase item |
| POST | `/api/store` | 🔒 admin | Add item |
| PATCH | `/api/store/:id` | 🔒 admin | Edit item |
| DELETE | `/api/store/:id` | 🔒 admin | Delete item |

## Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/:id/profile` | ❌ | Public profile |
| POST | `/api/users/:id/review` | ✅ | Submit review |
| GET | `/api/users/me/dashboard` | ✅ | My dashboard data |
| POST | `/api/users/me/stripe-onboard` | ✅ | Stripe Connect onboarding URL |

## Transactions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/transactions/me` | ✅ | My transactions |
| GET | `/api/transactions` | 🔒 admin | All transactions |
| GET | `/api/transactions/:id` | 🔒 admin | Transaction detail |

## Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/metrics` | 🔒 admin | Platform metrics |
| GET | `/api/admin/users` | 🔒 admin | All users |
| PATCH | `/api/admin/users/:id/ban` | 🔒 admin | Ban user |
| PATCH | `/api/admin/users/:id/role` | 🔒 admin | Change role |

## Webhooks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/webhooks/stripe` | Stripe sig | Stripe event handler |
