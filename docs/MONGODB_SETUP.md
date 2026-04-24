# MongoDB connection — Sprint 3

Our backend (NestJS microservices) uses **Mongoose**. The Mongo URI is read
from the `MONGODB_URI` environment variable — see `libs/common/src/database/mongo.config.ts`
and `.env.example`.

## 1. Local MongoDB (quickest)

```bash
# Install locally (macOS)
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0

# Set in .env (same folder as package.json)
MONGODB_URI=mongodb://127.0.0.1:27017/clothing_store
```

## 2. Docker Compose (recommended — matches CI)

A `docker-compose.yml` already ships Mongo + Mailpit + all services.

```bash
cp .env.example .env
docker compose up -d mongo mailpit
docker compose up api-gateway login-service register-service main-service card-service
# Frontend:
cd frontend && npm install && npm run dev
```

Mongo is reachable inside the compose network at `mongodb://mongo:27017/clothing_store`
and from the host at `mongodb://localhost:27017/clothing_store`.

## 3. MongoDB Atlas (cloud)

1. Go to https://cloud.mongodb.com → create a free M0 cluster.
2. **Database Access** → create a user (e.g. `aura_app`) with a strong password.
3. **Network Access** → allow your IP (or `0.0.0.0/0` for demo).
4. **Connect → Drivers** → copy the SRV URI:
   ```
   mongodb+srv://aura_app:<password>@cluster0.xxxx.mongodb.net/clothing_store?retryWrites=true&w=majority
   ```
5. Paste into `.env`:
   ```
   MONGODB_URI=mongodb+srv://aura_app:<password>@cluster0.xxxx.mongodb.net/clothing_store
   ```
6. Restart services.

## 4. Seeding demo data

```bash
node scripts/seed.js   # seeds categories, products, demo users
```

Test users after seed:
- Customer: `customer@aura.test` / `password123`
- Manager:  `manager@aura.test`  / `password123`

## 5. Verifying the connection

On boot each service logs:

```
[Nest] Mongoose connected to <host>/<db>
```

Quick health check:

```bash
curl http://localhost:3000            # → { service: 'api-gateway', ... }
curl http://localhost:3000/products   # → { items: [...] }
```

## 6. Collections in use

| Collection        | Schema                                                |
|-------------------|-------------------------------------------------------|
| `products`        | `backend/apps/main-service/src/schemas/product.schema.ts` |
| `categories`      | `backend/apps/main-service/src/schemas/category.schema.ts`|
| `comments`        | `libs/common/src/database/schemas/comment.schema.ts`  |
| `orders`          | `libs/common/src/database/schemas/order.schema.ts`    |
| `deliveries`      | `libs/common/src/database/schemas/delivery.schema.ts` |
| `invoices`        | `libs/common/src/database/schemas/invoice.schema.ts`  |
| `refundRequests`  | `libs/common/src/database/schemas/refund-request.schema.ts` |
| `wishlists`       | `libs/common/src/database/schemas/wishlist.schema.ts` |
